"use server";

import { db } from "@/db";
import { expenses } from "@/db/schema";
import { requireTenant, logActivity } from "@/lib/server";
import { revalidatePath } from "next/cache";
import { isValidAmount, num } from "@/lib/money";

export async function recordExpenseAction(formData: FormData) {
  const t = await requireTenant();
  const amount = String(formData.get("amount") || "0");
  if (!isValidAmount(amount)) return;
  await db.insert(expenses).values({
    businessId: t.businessId,
    projectId: String(formData.get("projectId") || "") || null,
    category: String(formData.get("category") || "") || null,
    description: String(formData.get("description") || "") || null,
    amount: num(amount),
    currency: String(formData.get("currency") || "NGN").toUpperCase(),
    date: String(formData.get("date") || new Date().toISOString().slice(0, 10)),
    vendor: String(formData.get("vendor") || "") || null,
    notes: String(formData.get("notes") || "") || null,
  });
  await logActivity(t.businessId, "expense.recorded", { actor: t.user.email, objectType: "expense", details: { amount } });
  revalidatePath("/finance");
}
