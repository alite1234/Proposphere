import { redirect } from "next/navigation";
import { db } from "@/db";
import { activityLogs, notifications, documentSequences, businesses, businessMembers } from "@/db/schema";
import { getTenant, type TenantContext } from "./auth";
import { and, eq, sql } from "drizzle-orm";

export async function requireTenant(): Promise<TenantContext> {
  const t = await getTenant();
  if (!t) redirect("/login");
  return t;
}

export async function requireOnboarded(): Promise<TenantContext> {
  const t = await requireTenant();
  return t;
}

export async function nextRef(businessId: string, kind: "proposal" | "quotation" | "receipt" | "payment"): Promise<string> {
  const prefix = { proposal: "PROP", quotation: "QUO", receipt: "REC", payment: "PAY" }[kind];
  const rows = await db
    .insert(documentSequences)
    .values({ businessId, kind, next: 1 })
    .onConflictDoUpdate({
      target: [documentSequences.businessId, documentSequences.kind],
      set: { next: sql`${documentSequences.next} + 1` },
    })
    .returning({ next: documentSequences.next });
  const n = rows[0].next;
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${String(n).padStart(4, "0")}`;
}

export async function logActivity(
  businessId: string,
  action: string,
  opts: { actor?: string | null; objectType?: string | null; objectId?: string | null; details?: Record<string, unknown> } = {}
) {
  await db.insert(activityLogs).values({
    businessId,
    action,
    actor: opts.actor,
    objectType: opts.objectType,
    objectId: opts.objectId,
    details: opts.details ?? {},
  });
}

export async function notify(
  businessId: string,
  kind: string,
  title: string,
  opts: { body?: string; link?: string; userId?: string } = {}
) {
  await db.insert(notifications).values({ businessId, kind, title, body: opts.body, link: opts.link, userId: opts.userId });
}

export async function ensureBusiness(userId: string, name: string): Promise<string> {
  const existing = await db
    .select({ id: businesses.id })
    .from(businessMembers)
    .innerJoin(businesses, eq(businesses.id, businessMembers.businessId))
    .where(eq(businessMembers.userId, userId))
    .limit(1);
  if (existing[0]) return existing[0].id;
  const [biz] = await db.insert(businesses).values({ name, ownerId: userId }).returning({ id: businesses.id });
  await db.insert(businessMembers).values({ businessId: biz.id, userId, role: "owner", permissions: ["all"] });
  return biz.id;
}

export async function getBusinessForUser(userId: string) {
  const rows = await db
    .select({ id: businesses.id, name: businesses.name, role: businessMembers.role })
    .from(businessMembers)
    .innerJoin(businesses, eq(businesses.id, businessMembers.businessId))
    .where(eq(businessMembers.userId, userId))
    .limit(1);
  return rows[0] ?? null;
}

export { and, eq };
