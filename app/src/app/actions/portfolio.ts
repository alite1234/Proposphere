"use server";

import { db } from "@/db";
import { portfolioItems } from "@/db/schema";
import { requireTenant, logActivity } from "@/lib/server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function savePortfolioAction(formData: FormData) {
  const t = await requireTenant();
  const id = String(formData.get("id") || "").trim();
  const values = {
    businessId: t.businessId,
    kind: String(formData.get("kind") || "project"),
    title: String(formData.get("title") || "").trim(),
    description: String(formData.get("description") || "").trim() || null,
    category: String(formData.get("category") || "").trim() || null,
    date: String(formData.get("date") || "").trim() || null,
    resultMetric: String(formData.get("resultMetric") || "").trim() || null,
    imageUrl: String(formData.get("imageUrl") || "").trim() || null,
    visible: true,
  };
  if (!values.title) return;
  if (id) {
    await db.update(portfolioItems).set(values).where(and(eq(portfolioItems.id, id), eq(portfolioItems.businessId, t.businessId)));
  } else {
    await db.insert(portfolioItems).values(values);
  }
  await logActivity(t.businessId, id ? "portfolio.updated" : "portfolio.created", { actor: t.user.email, objectType: "portfolio", details: { title: values.title } });
  revalidatePath("/portfolio");
}

export async function deletePortfolioAction(formData: FormData) {
  const t = await requireTenant();
  const id = String(formData.get("id") || "");
  await db.delete(portfolioItems).where(and(eq(portfolioItems.id, id), eq(portfolioItems.businessId, t.businessId)));
  revalidatePath("/portfolio");
}
