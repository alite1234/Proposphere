"use client";

import { sql } from "drizzle-orm";
import {
  pgTable,
  serial,
  text,
  integer,
  real,
  boolean,
  timestamp,
  json,
  varchar,
  pgEnum,
} from "drizzle-orm/pg";

// ===== Enums =====

export const userRoleEnum = pgEnum("user_role", ["owner", "member", "viewer"]);
export const proposalStatusEnum = pgEnum("proposal_status", [
  "draft",
  "discovery",
  "ready",
  "sent",
  "viewed",
  "changes_requested",
  "accepted",
  "declined",
  "expired",
  "withdrawn",
  "converted_to_project",
]);
export const packageLevelEnum = pgEnum("package_level", ["basic", "professional", "enterprise"]);
export const decisionEnum = pgEnum("decision", ["include", "exclude", "ask_client"]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "confirmed",
  "failed",
  "reversed",
  "refunded",
  "manually_recorded",
]);
export const transactionTypeEnum = pgEnum("transaction_type", [
  "deposit",
  "part_payment",
  "instalment",
  "milestone",
  "final_balance",
  "full_payment",
  "refund",
]);
export const clientTypeEnum = pgEnum("client_type", ["individual", "organization"]);
export const relationshipStatusEnum = pgEnum("relationship_status", [
  "new_lead",
  "contacted",
  "discovery_scheduled",
  "needs_identified",
  "proposal_sent",
  "negotiation",
  "won",
  "lost",
  "existing_client",
  "archived",
]);

// ===== Identity & Tenancy =====

export const businesses = pgTable("businesses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  industry: text("industry"),
  website: text("website"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const businessMembers = pgTable("business_members", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id")
    .notNull()
    .references(() => businesses.id),
  userId: varchar("user_id", { length: 255 }).notNull(),
  role: userRoleEnum("role").default("member"),
  joinedAt: timestamp("joined_at").defaultNow(),
  permissions: json("permissions").$type<Set<string>>(),
});

// ===== Business Profile & Branding =====

export const businessProfiles = pgTable("business_profiles", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id")
    .notNull()
    .references(() => businesses.id),
  whatWeDo: text("what_we_do"),
  whoWeServe: text("who_we_serve"),
  differentiators: text("differentiators"),
  toneOfVoice: text("tone_of_voice"),
  logoUrl: text("logo_url"),
});

export const brandSettings = pgTable("brand_settings", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id")
    .notNull()
    .references(() => businesses.id),
  primaryColor: text("primary_color"),
  secondaryColor: text("secondary_color"),
  accentColor: text("accent_color"),
  fontFamily: text("font_family"),
  logoUrl: text("logo_url"),
  footerText: text("footer_text"),
  contactDetails: text("contact_details"),
});

export const portfolioItems = pgTable("portfolio_items", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id")
    .notNull()
    .references(() => businesses.id),
  title: text("title").notNull(),
  description: text("description"),
  kind: text("kind"), // case_study, project, testimonial, award, certification
  titleMetric: text("title_metric"), // e.g., "Increased revenue by 30%"
  resultMetric: text("result_metric"),
  imageUrl: text("image_url"),
  visible: boolean("visible").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const testimonials = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id")
    .notNull()
    .references(() => businesses.id),
  clientName: text("client_name").notNull(),
  clientTitle: text("client_title"),
  content: text("content").notNull(),
  rating: integer("rating"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ===== Services, Packages & Pricing Catalogue =====

export const serviceCategories = pgTable("service_categories", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id")
    .notNull()
    .references(() => businesses.id),
  name: text("name").notNull(),
  description: text("description"),
  parentId: integer("parent_id").references(() => serviceCategories.id),
  orderIndex: integer("order_index").default(0),
});

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id")
    .notNull()
    .references(() => businesses.id),
  categoryId: integer("category_id")
    .notNull()
    .references(() => serviceCategories.id),
  name: text("name").notNull(),
  description: text("description"),
  scope: text("scope"),
  deliverables: text("deliverables"),
  unit: varchar("unit", { length: 50 }).default("project"),
  defaultQuantity: varchar("default_quantity", { length: 50 }).default("1"),
  basePrice: text("base_price").notNull(), // stored as string for decimal safety
  priceRange: text("price_range"),
  hourlyRate: real("hourly_rate"),
  estimatedDurationDays: integer("estimated_duration_days"),
  exclusions: text("exclusions"),
  isActive: boolean("is_active").default(true),
  orderIndex: integer("order_index").default(0),
});

export const packageItems = pgTable("package_items", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id")
    .notNull()
    .references(() => businesses.id),
  packageName: varchar("package_name", { length: 50 }).notNull(),
  includedServices: json("included_services").$type<Set<string>>(),
  includedFeatures: json("included_features").$type<Set<string>>(),
  limits: text("limits"),
  deliveryTimeline: text("delivery_timeline"),
  supportDays: integer("support_days"),
  price: text("price").notNull(),
  isRecommended: boolean("is_recommended").default(false),
  terms: text("terms"),
  orderIndex: integer("order_index").default(0),
});

export const priceRules = pgTable("price_rules", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id")
    .notNull()
    .references(() => businesses.id),
  name: text("name").notNull(),
  type: varchar("type", { length: 50 }), // e.g., "quantity_based", "milestone", "hourly"
  condition: text("condition"),
  discountPercentage: real("discount_percentage"),
  discountAmount: real("discount_amount"),
  minQuantity: integer("min_quantity"),
  maxQuantity: integer("max_quantity"),
  isActive: boolean("is_active").default(true),
});

// ===== CRM =====

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id")
    .notNull()
    .references(() => businesses.id),
  name: text("name").notNull(),
  clientType: clientTypeEnum("client_type").default("individual"),
  industry: text("industry"),
  contactPerson: text("contact_person"),
  roleTitle: text("role_title"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  website: text("website"),
  tags: json("tags").$type<Set<string>>(),
  relationshipStatus: relationshipStatusEnum("relationship_status").default("new_lead"),
  source: varchar("source", { length: 100 }), // referral, website, etc.
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  lastInteraction: timestamp("last_interaction"),
});

export const pipelineStages = pgTable("pipeline_stages", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id")
    .notNull()
    .references(() => businesses.id),
  name: text("name").notNull(),
  orderIndex: integer("order_index").default(0),
  isWon: boolean("is_won").default(false),
  isLost: boolean("is_lost").default(false),
});

export const clientInteractions = pgTable("client_interactions", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id")
    .notNull()
    .references(() => businesses.id),
  clientId: integer("client_id").references(() => clients.id),
  type: varchar("type", { length: 50 }), // call, email, meeting
  outcome: text("outcome"),
  notes: text("notes"),
  date: timestamp("date").defaultNow(),
  createdBy: varchar("created_by", { length: 255 }),
});

// ===== Opportunities & AI Discovery =====

export const opportunities = pgTable("opportunities", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id")
    .notNull()
    .references(() => businesses.id),
  clientId: integer("client_id").references(() => clients.id),
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
  source: varchar("source", { length: 100 }),
  brief: text("brief"),
  desiredOutcome: text("desired_outcome"),
  status: proposalStatusEnum("status").default("draft"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const discoverySessions = pgTable("discovery_sessions", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id")
    .notNull()
    .references(() => businesses.id),
  opportunityId: integer("opportunity_id")
    .notNull()
    .references(() => opportunities.id),
  status: varchar("status", { length: 50 }).default("draft"),
  analysis: json("analysis").$type<{
    likelyNeeds: string[];
    unclearOrMissing: string[];
    risksAndAssumptions: string[];
    relevantServiceIds: string[];
    likelyConcerns: string[];
    infoNeededToPrice: string[];
    summary: string;
  }>(),
  questions: json("questions").$type<{
    id: string;
    question: string;
    why: string;
  }>(),
  answers: json("answers").$type<Record<string, string>>(),
  recommendations: json("recommendations").$type<{
    id: string;
    name: string;
    what: string;
    why: string;
    problem: string;
    level: string;
    estimatedCost: string;
    timelineImpact: string;
    decision: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ===== Proposals =====

export const proposals = pgTable("proposals", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id")
    .notNull()
    .references(() => businesses.id),
  clientId: integer("client_id").references(() => clients.id),
  opportunityId: integer("opportunity_id").references(() => opportunities.id),
  reference: varchar("reference", { length: 50 }).notNull(),
  title: text("title").notNull(),
  status: proposalStatusEnum("status").default("draft"),
  currency: varchar("currency", { length: 10 }).default("NGN"),
  subtotal: real("subtotal").default(0),
  discountAmount: real("discount_amount").default(0),
  discountType: varchar("discount_type", { length: 20 }).default("none"),
  discountValue: text("discount_value").default("0"),
  taxRate: real("tax_rate").default(0),
  tax: real("tax").default(0),
  total: real("total").default(0),
  currentVersion: integer("current_version").default(1),
  validityUntil: timestamp("validity_until"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const proposalVersions = pgTable("proposal_versions", {
  id: serial("id").primaryKey(),
  proposalId: integer("proposal_id")
    .notNull()
    .references(() => proposals.id),
  version: integer("version").notNull(),
  content: json("content").$type<{
    sections: Array<{ kind: string; body: string; enabled: boolean }>;
    assumptions: string[];
    comparison: { enabled: boolean; columns: string[]; rows: Array<{ feature: string; values: string[] }>; recommended: string; note: string };
    pricing: { subtotal: number; discount: number; discountType: string; discountValue: string; taxRate: number; tax: number; total: number; currency: string };
  }>,
  createdBy: varchar("created_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const proposalSections = pgTable("proposal_sections", {
  id: serial("id").primaryKey(),
  proposalId: integer("proposal_id")
    .notNull()
    .references(() => proposals.id),
  kind: varchar("kind", { length: 50 }).notNull, // cover, meta, parties, toc, executive_summary, etc.
  title: text("title"),
  body: text("body"),
  enabled: boolean("enabled").default(true),
  orderIndex: integer("order_index").default(0),
});

export const proposalTokens = pgTable("proposal_tokens", {
  id: serial("id").primaryKey(),
  proposalId: integer("proposal_id")
    .notNull()
    .references(() => proposals.id),
  tokenHash: varchar("token_hash", { length: 255 }).notNull,
  expiresAt: timestamp("expires_at").notNull,
  permissions: json("permissions").$type<{ view: boolean; approve: boolean }>(),
  usedAt: timestamp("used_at"),
  clientSuppliedEmail: text("client_supplied_email"),
  acceptedVersion: integer("accepted_version"),
  acceptedAt: timestamp("accepted_at"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
});

// ===== Quotations & Receipts =====

export const quotations = pgTable("quotations", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id")
    .notNull()
    .references(() => businesses.id),
  clientId: integer("client_id").references(() => clients.id),
  reference: varchar("reference", { length: 50 }).notNull,
  issueDate: timestamp("issue_date").defaultNow(),
  expiryDate: timestamp("expiry_date"),
  status: varchar("status", { length: 50 }).default("draft"),
  currency: varchar("currency", { length: 10 }).default("NGN"),
  subtotal: real("subtotal").default(0),
  discountAmount: real("discount_amount").default(0),
  discountType: varchar("discount_type", { length: 20 }).default("none"),
  discountValue: text("discount_value").default("0"),
  taxRate: real("tax_rate").default(0),
  tax: real("tax").default(0),
  total: real("total").default(0),
  paymentTerms: text("payment_terms"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const quotationItems = pgTable("quotation_items", {
  id: serial("id").primaryKey(),
  quotationId: integer("quotation_id")
    .notNull()
    .references(() => quotations.id),
  serviceId: integer("service_id").references(() => services.id),
  description: text("description").notNull(),
  quantity: varchar("quantity", { length: 50 }).notNull(),
  unit: varchar("unit", { length: 50 }).default("item"),
  unitPrice: text("unit_price").notNull(),
  lineDiscount: text("line_discount").default("0"),
  lineTaxRate: real("line_tax_rate").default(0),
});

export const receipts = pgTable("receipts", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id")
    .notNull()
    .references(() => businesses.id),
  clientId: integer("client_id").references(() => clients.id),
  quotationId: integer("quotation_id").references(() => quotations.id),
  relatedProjectId: integer("related_project_id"),
  receiptNumber: varchar("receipt_number", { length: 50 }).notNull,
  paymentDate: timestamp("payment_date").defaultNow(),
  paymentMethod: varchar("payment_method", { length: 50 }),
  transactionReference: text("transaction_reference"),
  amountReceived: real("amount_received").notNull(),
  currency: varchar("currency", { length: 10 }).default("NGN"),
  previousAmountPaid: real("previous_amount_paid").default(0),
  totalProjectAmount: real("total_project_amount").default(0),
  outstandingBalance: real("outstanding_balance").default(0),
  status: varchar("status", { length: 20 }).default("confirmed"),
  notes: text("notes"),
  generatedAt: timestamp("generated_at").defaultNow(),
});

// ===== Projects =====

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id")
    .notNull()
    .references(() => businesses.id),
  clientId: integer("client_id").references(() => clients.id),
  proposalId: integer("proposal_id").references(() => proposals.id),
  selectedPackage: varchar("selected_package", { length: 50 }),
  status: varchar("status", { length: 50 }).default("planning"),
  totalAmount: real("total_amount").default(0),
  currency: varchar("currency", { length: 10 }).default("NGN"),
  paymentSchedule: text("payment_schedule"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const projectTasks = pgTable("project_tasks", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id),
  title: text("title").notNull(),
  description: text("description"),
  assignee: varchar("assignee", { length: 255 }),
  status: varchar("status", { length: 50 }).default("pending"),
  priority: varchar("priority", { length: 20 }).default("normal"),
  dueDate: timestamp("due_date"),
  orderIndex: integer("order_index").default(0),
  weight: integer("weight").default(10), // for progress calculation
  completedAt: timestamp("completed_at"),
});

export const projectMilestones = pgTable("project_milestones", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id),
  title: text("title").notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).default("pending"),
  dueDate: timestamp("due_date"),
  orderIndex: integer("order_index").default(0),
  completedAt: timestamp("completed_at"),
});

// ===== Notifications & Activity =====

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id")
    .notNull()
    .references(() => businesses.id),
  userId: varchar("user_id", { length: 255 }),
  type: varchar("type", { length: 50 }), // proposal_viewed, proposal_accepted, payment_received, etc.
  title: text("title").notNull(),
  message: text("message").notNull(),
  relatedId: varchar("related_id", { length: 255 }),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id")
    .notNull()
    .references(() => businesses.id),
  action: varchar("action", { length: 100 }).notNull,
  entity: varchar("entity", { length: 50 }), // proposal, client, quotation, etc.
  entityId: varchar("entity_id", { length: 255 }),
  actor: varchar("actor", { length: 255 }),
  details: json("details"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});