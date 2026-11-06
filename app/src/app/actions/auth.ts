"use server";

import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword, verifyPassword, createSession, destroySession, rateLimit } from "@/lib/auth";
import { ensureBusiness, logActivity } from "@/lib/server";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

export async function registerAction(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const businessName = String(formData.get("businessName") || "").trim() || `${name}'s Business`;

  if (!name || !email || password.length < 8) {
    redirect("/register?error=Please+fill+all+fields.+Password+must+be+at+least+8+characters.");
  }
  const h = await headers();
  const ip = h.get("x-forwarded-for") ?? "local";
  if (!rateLimit(`register:${ip}`, 10, 60_000)) redirect("/register?error=Too+many+attempts.+Try+again+shortly.");

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing[0]) redirect("/register?error=An+account+with+this+email+already+exists.");

  const [user] = await db
    .insert(users)
    .values({ email, name, passwordHash: hashPassword(password) })
    .returning({ id: users.id });
  const businessId = await ensureBusiness(user.id, businessName);
  await createSession(user.id);
  await logActivity(businessId, "business.created", { actor: email, objectType: "business", objectId: businessId });
  redirect("/onboarding");
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "");
  const h = await headers();
  const ip = h.get("x-forwarded-for") ?? "local";
  if (!rateLimit(`login:${ip}:${email}`, 8, 60_000)) redirect("/login?error=Too+many+attempts.+Try+again+shortly.");

  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = rows[0];
  if (!user || !verifyPassword(password, user.passwordHash)) {
    redirect(`/login?error=Invalid+email+or+password.${next ? `&next=${encodeURIComponent(next)}` : ""}`);
  }
  await createSession(user.id);
  // Only allow internal paths to prevent open redirects
  const target = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  redirect(target);
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}
