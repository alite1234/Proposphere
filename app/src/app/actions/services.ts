"use server";

import { db } from "@/db";
import { services, packages } from "@/db/schema";
import { requireTenant, logActivity } from "@/lib/server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

function s(fd: FormData, k: string) {
  return String(fd.get(k) || "").trim() || null;
}

export async function saveServiceAction(formData: FormData) {
  const t = await requireTenant();
  const id = s(formData, "id");
  const values = {
    businessId: t.businessId,
    name: String(formData.get("name") || "").trim(),
    category: s(formData, "category"),
    description: s(formData, "description"),
    scope: s(formData, "scope"),
    deliverables: s(formData, "deliverables"),
    unit: s(formData, "unit") || "item",
    defaultQuantity: String(formData.get("defaultQuantity") || "1"),
    basePrice: String(formData.get("basePrice") || "0"),
    priceMax: s(formData, "priceMax"),
    durationDays: formData.get("durationDays") ? Number(formData.get("durationDays")) : null,
    exclusions: s(formData, "exclusions"),
    warrantyDays: formData.get("warrantyDays") ? Number(formData.get("warrantyDays")) : null,
    taxRate: String(formData.get("taxRate") || "0"),
    active: formData.get("active") !== "off",
  };
  if (!values.name) return;
  if (id) {
    await db.update(services).set(values).where(and(eq(services.id, id), eq(services.businessId, t.businessId)));
  } else {
    await db.insert(services).values(values);
  }
  await logActivity(t.businessId, id ? "service.updated" : "service.created", { actor: t.user.email, objectType: "service", details: { name: values.name } });
  revalidatePath("/services");
}

export async function archiveServiceAction(formData: FormData) {
  const t = await requireTenant();
  const id = String(formData.get("id") || "");
  await db.update(services).set({ active: false }).where(and(eq(services.id, id), eq(services.businessId, t.businessId)));
  revalidatePath("/services");
}

export async function savePackageAction(formData: FormData) {
  const t = await requireTenant();
  const id = s(formData, "id");
  const features = String(formData.get("features") || "").split("\n").map((x) => x.trim()).filter(Boolean);
  const serviceIds = formData.getAll("serviceIds").map(String);
  const values = {
    businessId: t.businessId,
    name: String(formData.get("name") || "").trim(),
    description: s(formData, "description"),
    serviceIds,
    features,
    limits: s(formData, "limits"),
    timelineDays: formData.get("timelineDays") ? Number(formData.get("timelineDays")) : null,
    supportDays: formData.get("supportDays") ? Number(formData.get("supportDays")) : null,
    price: String(formData.get("price") || "0"),
    recommended: formData.get("recommended") === "on",
    terms: s(formData, "terms"),
    active: true,
  };
  if (!values.name) return;
  if (id) {
    await db.update(packages).set(values).where(and(eq(packages.id, id), eq(packages.businessId, t.businessId)));
  } else {
    await db.insert(packages).values(values);
  }
  await logActivity(t.businessId, id ? "package.updated" : "package.created", { actor: t.user.email, objectType: "package", details: { name: values.name } });
  revalidatePath("/services");
}

export async function archivePackageAction(formData: FormData) {
  const t = await requireTenant();
  const id = String(formData.get("id") || "");
  await db.update(packages).set({ active: false }).where(and(eq(packages.id, id), eq(packages.businessId, t.businessId)));
  revalidatePath("/services");
}
