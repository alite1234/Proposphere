"use server";

import { db } from "@/db";
import { businessProfiles, brandSettings, taxSettings, businesses } from "@/db/schema";
import { requireTenant, logActivity } from "@/lib/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export async function saveProfileAction(formData: FormData) {
  const t = await requireTenant();
  const g = (k: string) => String(formData.get(k) || "").trim() || null;
  const values = {
    businessId: t.businessId,
    description: g("description"),
    industry: g("industry"),
    address: g("address"),
    contactPerson: g("contactPerson"),
    email: g("email"),
    phone: g("phone"),
    website: g("website"),
    yearsInOperation: formData.get("yearsInOperation") ? Number(formData.get("yearsInOperation")) : null,
    registrationDetails: g("registrationDetails"),
    taxId: g("taxId"),
    whatWeDo: g("whatWeDo"),
    whoWeServe: g("whoWeServe"),
    customerTypes: g("customerTypes"),
    serviceArea: g("serviceArea"),
    differentiators: g("differentiators"),
    mission: g("mission"),
    typicalProjectSize: g("typicalProjectSize"),
    toneOfVoice: g("toneOfVoice") || "professional",
    problemsSolved: g("problemsSolved"),
    updatedAt: new Date(),
  };
  await db
    .insert(businessProfiles)
    .values(values)
    .onConflictDoUpdate({ target: businessProfiles.businessId, set: values });
  await logActivity(t.businessId, "profile.updated", { actor: t.user.email });
  redirect("/settings?saved=profile");
}

export async function saveBrandAction(formData: FormData) {
  const t = await requireTenant();
  const g = (k: string) => String(formData.get(k) || "").trim() || null;
  const values = {
    businessId: t.businessId,
    logoUrl: g("logoUrl"),
    primaryColor: g("primaryColor") || "#1e40af",
    secondaryColor: g("secondaryColor") || "#64748b",
    accentColor: g("accentColor") || "#f59e0b",
    fontFamily: g("fontFamily") || "Inter",
    documentStyle: g("documentStyle") || "corporate",
    signatureUrl: g("signatureUrl"),
    stampUrl: g("stampUrl"),
    footerText: g("footerText"),
    showPageNumbers: formData.get("showPageNumbers") === "on",
    updatedAt: new Date(),
  };
  await db.insert(brandSettings).values(values).onConflictDoUpdate({ target: brandSettings.businessId, set: values });
  await logActivity(t.businessId, "brand.updated", { actor: t.user.email });
  redirect("/settings?saved=brand");
}

export async function saveFinanceSettingsAction(formData: FormData) {
  const t = await requireTenant();
  const values = {
    businessId: t.businessId,
    currency: String(formData.get("currency") || "NGN").trim().toUpperCase() || "NGN",
    defaultTaxRate: String(formData.get("defaultTaxRate") || "0"),
    taxLabel: String(formData.get("taxLabel") || "VAT"),
    pricesIncludeTax: formData.get("pricesIncludeTax") === "on",
  };
  await db.insert(taxSettings).values(values).onConflictDoUpdate({ target: taxSettings.businessId, set: values });
  await db.update(businesses).set({ name: String(formData.get("businessName") || t.businessName).trim() || t.businessName }).where(eq(businesses.id, t.businessId));
  redirect("/settings?saved=finance");
}
