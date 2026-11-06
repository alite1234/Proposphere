import {
  pgTable,
  text,
  timestamp,
  integer,
  numeric,
  boolean,
  jsonb,
  uuid,
  index,
  uniqueIndex,
  date,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ---------- Identity & tenancy ----------

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)]
);

export const businesses = pgTable("businesses", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  ownerId: uuid("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const businessMembers = pgTable(
  "business_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("owner"), // owner | admin | member
    permissions: jsonb("permissions").$type<string[]>().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("biz_member_unique").on(t.businessId, t.userId)]
);

// ---------- Business profile ----------

export const businessProfiles = pgTable("business_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }).unique(),
  description: text("description"),
  industry: text("industry"),
  address: text("address"),
  contactPerson: text("contact_person"),
  email: text("email"),
  phone: text("phone"),
  website: text("website"),
  socialLinks: jsonb("social_links").$type<Record<string, string>>().notNull().default({}),
  yearsInOperation: integer("years_in_operation"),
  registrationDetails: text("registration_details"),
  taxId: text("tax_id"),
  // positioning
  whatWeDo: text("what_we_do"),
  whoWeServe: text("who_we_serve"),
  customerTypes: text("customer_types"),
  serviceArea: text("service_area"),
  differentiators: text("differentiators"),
  mission: text("mission"),
  typicalProjectSize: text("typical_project_size"),
  toneOfVoice: text("tone_of_voice").default("professional"),
  problemsSolved: text("problems_solved"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const brandSettings = pgTable("brand_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }).unique(),
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color").default("#1e40af"),
  secondaryColor: text("secondary_color").default("#64748b"),
  accentColor: text("accent_color").default("#f59e0b"),
  fontFamily: text("font_family").default("Inter"),
  documentStyle: text("document_style").default("corporate"),
  signatureUrl: text("signature_url"),
  stampUrl: text("stamp_url"),
  footerText: text("footer_text"),
  showPageNumbers: boolean("show_page_numbers").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const portfolioItems = pgTable(
  "portfolio_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    kind: text("kind").notNull().default("project"), // project | case_study | testimonial | award | certification | team_bio | reference
    title: text("title").notNull(),
    description: text("description"),
    category: text("category"),
    date: date("date"),
    resultMetric: text("result_metric"),
    imageUrl: text("image_url"),
    visible: boolean("visible").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("portfolio_biz_idx").on(t.businessId)]
);

// ---------- Catalogue ----------

export const services = pgTable(
  "services",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    category: text("category"),
    description: text("description"),
    scope: text("scope"),
    deliverables: text("deliverables"),
    unit: text("unit").default("item"),
    defaultQuantity: numeric("default_quantity", { precision: 14, scale: 2 }).notNull().default("1"),
    basePrice: numeric("base_price", { precision: 14, scale: 2 }).notNull().default("0"),
    priceMax: numeric("price_max", { precision: 14, scale: 2 }),
    durationDays: integer("duration_days"),
    addOns: jsonb("add_ons").$type<{ name: string; price: string }[]>().notNull().default([]),
    exclusions: text("exclusions"),
    warrantyDays: integer("warranty_days"),
    taxRate: numeric("tax_rate", { precision: 6, scale: 4 }).notNull().default("0"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("services_biz_idx").on(t.businessId)]
);

export const packages = pgTable(
  "packages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    serviceIds: jsonb("service_ids").$type<string[]>().notNull().default([]),
    features: jsonb("features").$type<string[]>().notNull().default([]),
    limits: text("limits"),
    timelineDays: integer("timeline_days"),
    supportDays: integer("support_days"),
    price: numeric("price", { precision: 14, scale: 2 }).notNull().default("0"),
    recommended: boolean("recommended").notNull().default(false),
    terms: text("terms"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("packages_biz_idx").on(t.businessId)]
);

export const taxSettings = pgTable("tax_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }).unique(),
  defaultTaxRate: numeric("default_tax_rate", { precision: 6, scale: 4 }).notNull().default("0"),
  taxLabel: text("tax_label").default("VAT"),
  pricesIncludeTax: boolean("prices_include_tax").notNull().default(false),
  currency: text("currency").notNull().default("NGN"),
});

// ---------- CRM ----------

export const clients = pgTable(
  "clients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: text("type").notNull().default("organization"), // individual | organization
    industry: text("industry"),
    contactPerson: text("contact_person"),
    role: text("role"),
    email: text("email"),
    phone: text("phone"),
    address: text("address"),
    website: text("website"),
    leadSource: text("lead_source"),
    assignedTo: uuid("assigned_to").references(() => users.id, { onDelete: "set null" }),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    notes: text("notes"),
    relationshipStatus: text("relationship_status").notNull().default("lead"), // lead | client | archived
    pipelineStage: text("pipeline_stage").notNull().default("new_lead"),
    lastInteractionAt: timestamp("last_interaction_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("clients_biz_idx").on(t.businessId)]
);

export const clientInteractions = pgTable(
  "client_interactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    clientId: uuid("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
    kind: text("kind").notNull().default("note"), // note | call | meeting | email | message
    summary: text("summary"),
    outcome: text("outcome"),
    nextAction: text("next_action"),
    followUpAt: timestamp("follow_up_at", { withTimezone: true }),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("interactions_client_idx").on(t.clientId)]
);

// ---------- AI & proposals ----------

export const opportunities = pgTable(
  "opportunities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    clientName: text("client_name"),
    industry: text("industry"),
    clientDescription: text("client_description"),
    website: text("website"),
    contactName: text("contact_name"),
    contactRole: text("contact_role"),
    location: text("location"),
    goals: text("goals"),
    challenges: text("challenges"),
    source: text("source"),
    brief: text("brief"),
    desiredOutcome: text("desired_outcome"),
    status: text("status").notNull().default("open"), // open | converted | closed
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("opp_biz_idx").on(t.businessId)]
);

export const discoverySessions = pgTable(
  "discovery_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    opportunityId: uuid("opportunity_id").notNull().references(() => opportunities.id, { onDelete: "cascade" }),
    analysis: jsonb("analysis").$type<Record<string, unknown>>(),
    questions: jsonb("questions").$type<{ id: string; question: string; why: string }[]>().notNull().default([]),
    answers: jsonb("answers").$type<Record<string, string>>().notNull().default({}),
    recommendations: jsonb("recommendations").$type<Recommendation[]>().notNull().default([]),
    readiness: jsonb("readiness").$type<Record<string, unknown>>(),
    researchNotes: text("research_notes"),
    status: text("status").notNull().default("draft"), // draft | analyzed | ready | generated
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("ds_opp_idx").on(t.opportunityId)]
);

export type Recommendation = {
  id: string;
  name: string;
  what: string;
  why: string;
  problem: string;
  level: "essential" | "recommended" | "optional";
  serviceId?: string;
  estimatedCost?: string;
  timelineImpact?: string;
  decision: "include" | "exclude" | "ask_client" | "pending";
};

export const proposals = pgTable(
  "proposals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
    opportunityId: uuid("opportunity_id").references(() => opportunities.id, { onDelete: "set null" }),
    reference: text("reference").notNull(),
    title: text("title").notNull(),
    status: text("status").notNull().default("draft"),
    currency: text("currency").notNull().default("NGN"),
    total: numeric("total", { precision: 14, scale: 2 }).notNull().default("0"),
    template: text("template").notNull().default("corporate"),
    validUntil: date("valid_until"),
    currentVersion: integer("current_version").notNull().default(1),
    acceptedVersion: integer("accepted_version"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("proposals_biz_idx").on(t.businessId), uniqueIndex("proposal_ref_unique").on(t.businessId, t.reference)]
);

export const proposalVersions = pgTable(
  "proposal_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    proposalId: uuid("proposal_id").notNull().references(() => proposals.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    content: jsonb("content").$type<ProposalContent>().notNull(),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("proposal_version_unique").on(t.proposalId, t.version)]
);

export type ProposalSectionData = {
  id: string;
  kind: string;
  title: string;
  enabled: boolean;
  body: string; // markdown-ish rich text
  items?: { name: string; detail?: string; included?: string }[];
};

export type ProposalContent = {
  sections: ProposalSectionData[];
  comparison: {
    enabled: boolean;
    columns: string[]; // package names
    rows: { feature: string; values: string[] }[];
    recommended?: string;
    note?: string;
  };
  selectedPackageId?: string;
  pricing: { subtotal: string; discount: string; discountType: string; discountValue: string; taxRate: string; tax: string; total: string; currency: string };
  assumptions: string[];
};

export const proposalTokens = pgTable(
  "proposal_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    proposalId: uuid("proposal_id").notNull().references(() => proposals.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    version: integer("version").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revoked: boolean("revoked").notNull().default(false),
    requireEmailVerify: boolean("require_email_verify").notNull().default(false),
    clientEmail: text("client_email"),
    viewCount: integer("view_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("tokens_proposal_idx").on(t.proposalId)]
);

export const proposalEvents = pgTable(
  "proposal_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    proposalId: uuid("proposal_id").notNull().references(() => proposals.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(), // created | sent | viewed | accepted | declined | change_requested | revision
    data: jsonb("data").$type<Record<string, unknown>>().notNull().default({}),
    actor: text("actor"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("pevents_proposal_idx").on(t.proposalId)]
);

export const proposalAcceptances = pgTable("proposal_acceptances", {
  id: uuid("id").primaryKey().defaultRandom(),
  proposalId: uuid("proposal_id").notNull().references(() => proposals.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  tokenId: uuid("token_id").references(() => proposalTokens.id, { onDelete: "set null" }),
  signerName: text("signer_name").notNull(),
  signerEmail: text("signer_email"),
  signatureType: text("signature_type").notNull().default("click"), // click | typed | drawn
  signatureData: text("signature_data"),
  selectedPackageId: uuid("selected_package_id"),
  acceptedAmount: numeric("accepted_amount", { precision: 14, scale: 2 }).notNull(),
  currency: text("currency").notNull(),
  statementVersion: text("statement_version").notNull().default("v1"),
  documentHash: text("document_hash"),
  ip: text("ip"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const changeRequests = pgTable("change_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  proposalId: uuid("proposal_id").notNull().references(() => proposals.id, { onDelete: "cascade" }),
  fromClient: boolean("from_client").notNull().default(true),
  message: text("message").notNull(),
  resolved: boolean("resolved").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------- Quotations & receipts ----------

export const quotations = pgTable(
  "quotations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
    proposalId: uuid("proposal_id").references(() => proposals.id, { onDelete: "set null" }),
    reference: text("reference").notNull(),
    status: text("status").notNull().default("draft"),
    issueDate: date("issue_date").notNull().default(sql`CURRENT_DATE`),
    expiryDate: date("expiry_date"),
    currency: text("currency").notNull().default("NGN"),
    subtotal: numeric("subtotal", { precision: 14, scale: 2 }).notNull().default("0"),
    discountType: text("discount_type").notNull().default("none"), // none | amount | percent
    discountValue: numeric("discount_value", { precision: 14, scale: 2 }).notNull().default("0"),
    taxRate: numeric("tax_rate", { precision: 6, scale: 4 }).notNull().default("0"),
    tax: numeric("tax", { precision: 14, scale: 2 }).notNull().default("0"),
    total: numeric("total", { precision: 14, scale: 2 }).notNull().default("0"),
    paymentTerms: text("payment_terms"),
    notes: text("notes"),
    snapshot: jsonb("snapshot").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("quotes_biz_idx").on(t.businessId), uniqueIndex("quote_ref_unique").on(t.businessId, t.reference)]
);

export const quotationItems = pgTable(
  "quotation_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    quotationId: uuid("quotation_id").notNull().references(() => quotations.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id").references(() => services.id, { onDelete: "set null" }),
    description: text("description").notNull(),
    quantity: numeric("quantity", { precision: 14, scale: 2 }).notNull().default("1"),
    unit: text("unit").default("item"),
    unitPrice: numeric("unit_price", { precision: 14, scale: 2 }).notNull().default("0"),
    lineDiscount: numeric("line_discount", { precision: 14, scale: 2 }).notNull().default("0"),
    lineTaxRate: numeric("line_tax_rate", { precision: 6, scale: 4 }).notNull().default("0"),
    lineTotal: numeric("line_total", { precision: 14, scale: 2 }).notNull().default("0"),
    position: integer("position").notNull().default(0),
  },
  (t) => [index("qitems_quote_idx").on(t.quotationId)]
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
    projectId: uuid("project_id"),
    quotationId: uuid("quotation_id").references(() => quotations.id, { onDelete: "set null" }),
    reference: text("reference").notNull(),
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
    currency: text("currency").notNull().default("NGN"),
    paymentType: text("payment_type").notNull().default("part"), // deposit | part | instalment | milestone | final | full | refund
    method: text("method").notNull().default("bank_transfer"),
    providerRef: text("provider_ref"),
    verification: text("verification").notNull().default("manual"), // manual | provider
    status: text("status").notNull().default("confirmed"), // pending | confirmed | failed | reversed | refunded
    paymentDate: date("payment_date").notNull().default(sql`CURRENT_DATE`),
    notes: text("notes"),
    reversalOf: uuid("reversal_of"),
    recordedBy: uuid("recorded_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("payments_biz_idx").on(t.businessId), index("payments_client_idx").on(t.clientId)]
);

export const expenses = pgTable(
  "expenses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
    category: text("category"),
    description: text("description"),
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
    currency: text("currency").notNull().default("NGN"),
    date: date("date").notNull().default(sql`CURRENT_DATE`),
    vendor: text("vendor"),
    receiptUrl: text("receipt_url"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("expenses_biz_idx").on(t.businessId)]
);

export const receipts = pgTable(
  "receipts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    paymentId: uuid("payment_id").notNull().references(() => payments.id, { onDelete: "cascade" }),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
    reference: text("reference").notNull(),
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
    currency: text("currency").notNull().default("NGN"),
    previousPaid: numeric("previous_paid", { precision: 14, scale: 2 }).notNull().default("0"),
    totalAmount: numeric("total_amount", { precision: 14, scale: 2 }).notNull().default("0"),
    outstanding: numeric("outstanding", { precision: 14, scale: 2 }).notNull().default("0"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("receipts_biz_idx").on(t.businessId), uniqueIndex("receipt_ref_unique").on(t.businessId, t.reference)]
);

// ---------- Projects ----------

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
    proposalId: uuid("proposal_id").references(() => proposals.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    status: text("status").notNull().default("not_started"),
    currency: text("currency").notNull().default("NGN"),
    value: numeric("value", { precision: 14, scale: 2 }).notNull().default("0"),
    startDate: date("start_date"),
    dueDate: date("due_date"),
    scope: text("scope"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("projects_biz_idx").on(t.businessId)]
);

export const projectTasks = pgTable(
  "project_tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    milestoneId: uuid("milestone_id"),
    title: text("title").notNull(),
    description: text("description"),
    assigneeId: uuid("assignee_id").references(() => users.id, { onDelete: "set null" }),
    startDate: date("start_date"),
    dueDate: date("due_date"),
    priority: text("priority").notNull().default("medium"),
    weight: integer("weight").notNull().default(1),
    status: text("status").notNull().default("todo"), // todo | in_progress | done
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("tasks_project_idx").on(t.projectId)]
);

export const projectMilestones = pgTable(
  "project_milestones",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    dueDate: date("due_date"),
    weight: integer("weight").notNull().default(1),
    clientVisible: boolean("client_visible").notNull().default(false),
    completed: boolean("completed").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("milestones_project_idx").on(t.projectId)]
);

// ---------- Platform-wide ----------

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    link: text("link"),
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("notif_biz_idx").on(t.businessId)]
);

export const activityLogs = pgTable(
  "activity_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    actor: text("actor"),
    action: text("action").notNull(),
    objectType: text("object_type"),
    objectId: text("object_id"),
    details: jsonb("details").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("activity_biz_idx").on(t.businessId)]
);

export const documentSequences = pgTable("document_sequences", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(), // proposal | quotation | receipt
  next: integer("next").notNull().default(1),
}, (t) => [uniqueIndex("seq_unique").on(t.businessId, t.kind)]);
