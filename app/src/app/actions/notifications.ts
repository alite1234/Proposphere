"use server";

import { db } from "@/db";
import { notifications } from "@/db/schema";
import { requireTenant } from "@/lib/server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function markAllReadAction() {
  const t = await requireTenant();
  await db.update(notifications).set({ read: true }).where(and(eq(notifications.businessId, t.businessId), eq(notifications.read, false)));
  revalidatePath("/notifications");
}
