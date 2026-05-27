import { sql, type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const families = pgTable(
  "families",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull().unique(),
    displayName: text("display_name").notNull(),
    phone: text("phone"),
    role: text("role"),
    isSeed: boolean("is_seed").notNull().default(false),
    validated: boolean("validated").notNull().default(false),
    validatedAt: timestamp("validated_at", { withTimezone: true }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("families_email_idx").on(t.email)],
);

export const children = pgTable("children", {
  id: uuid("id").primaryKey().defaultRandom(),
  familyId: uuid("family_id")
    .notNull()
    .references(() => families.id, { onDelete: "cascade" }),
  firstName: text("first_name").notNull(),
  grade: text("grade"),
  level: text("level"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  icon: text("icon"),
  displayOrder: integer("display_order").notNull().default(0),
});

export const businesses = pgTable(
  "businesses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    address: text("address"),
    neighborhood: text("neighborhood"),
    categoryId: uuid("category_id").references(() => categories.id),
    photoFilename: text("photo_filename"),
    status: text("status").notNull().default("pending"),
    ownerEmail: text("owner_email").notNull(),
    ownerFamilyId: uuid("owner_family_id").references(() => families.id),
    whatsapp: text("whatsapp"),
    instagram: text("instagram"),
    website: text("website"),
    delivers: boolean("delivers").notNull().default(false),
    onlineOnly: boolean("online_only").notNull().default(false),
    byAppointment: boolean("by_appointment").notNull().default(false),
    tags: text("tags").array(),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    story: text("story"),
    isFeaturedStory: boolean("is_featured_story").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
  },
  (t) => [
    index("businesses_status_category_idx").on(t.status, t.categoryId),
    index("businesses_tags_gin_idx").using("gin", t.tags),
    index("businesses_search_gin_idx").using(
      "gin",
      sql`to_tsvector('spanish', coalesce(${t.name}, '') || ' ' || coalesce(${t.description}, ''))`,
    ),
  ],
);

export const validationRequests = pgTable(
  "validation_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    validatorFamilyId: uuid("validator_family_id")
      .notNull()
      .references(() => families.id),
    token: text("token").notNull().unique(),
    status: text("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("validation_requests_token_idx").on(t.token)],
);

export const accessTokens = pgTable(
  "access_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    token: text("token").notNull().unique(),
    email: text("email").notNull(),
    purpose: text("purpose").notNull(),
    targetId: uuid("target_id"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("access_tokens_token_idx").on(t.token)],
);

export const adminUsers = pgTable("admin_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: text("type").notNull(),
    actorEmail: text("actor_email"),
    entityType: text("entity_type"),
    entityId: uuid("entity_id"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("events_type_created_idx").on(t.type, t.createdAt)],
);

export const reactions = pgTable(
  "reactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    anonId: text("anon_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("reactions_unique_per_anon").on(t.businessId, t.kind, t.anonId),
    index("reactions_business_idx").on(t.businessId),
  ],
);

export const campaigns = pgTable(
  "campaigns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    description: text("description"),
    colorHex: text("color_hex").notNull().default("#c4502c"),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    ctaText: text("cta_text"),
    ctaHref: text("cta_href"),
    categoryIds: uuid("category_ids").array(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("campaigns_active_idx").on(t.isActive, t.endsAt)],
);

export const communityNeeds = pgTable(
  "community_needs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    queryOriginal: text("query_original").notNull(),
    queryExpanded: text("query_expanded"),
    name: text("name"),
    email: text("email"),
    whatsapp: text("whatsapp"),
    zone: text("zone"),
    categoryHintId: uuid("category_hint_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    urgency: text("urgency"),
    budget: text("budget"),
    consent: boolean("consent").notNull().default(false),
    status: text("status").notNull().default("new"),
    adminNotes: text("admin_notes"),
    matchedResults: jsonb("matched_results"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("community_needs_status_created_idx").on(t.status, t.createdAt),
    index("community_needs_created_idx").on(t.createdAt),
  ],
);

export const needSearchLogs = pgTable(
  "need_search_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    needId: uuid("need_id").references(() => communityNeeds.id, { onDelete: "set null" }),
    query: text("query").notNull(),
    resultsCount: integer("results_count").notNull().default(0),
    clickedBusinessId: uuid("clicked_business_id").references(() => businesses.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("need_search_logs_created_idx").on(t.createdAt)],
);

export type Family = InferSelectModel<typeof families>;
export type NewFamily = InferInsertModel<typeof families>;
export type Child = InferSelectModel<typeof children>;
export type NewChild = InferInsertModel<typeof children>;
export type Category = InferSelectModel<typeof categories>;
export type NewCategory = InferInsertModel<typeof categories>;
export type Business = InferSelectModel<typeof businesses>;
export type NewBusiness = InferInsertModel<typeof businesses>;
export type ValidationRequest = InferSelectModel<typeof validationRequests>;
export type NewValidationRequest = InferInsertModel<typeof validationRequests>;
export type AccessToken = InferSelectModel<typeof accessTokens>;
export type NewAccessToken = InferInsertModel<typeof accessTokens>;
export type AdminUser = InferSelectModel<typeof adminUsers>;
export type NewAdminUser = InferInsertModel<typeof adminUsers>;
export type EventLog = InferSelectModel<typeof events>;
export type NewEventLog = InferInsertModel<typeof events>;
export type Reaction = InferSelectModel<typeof reactions>;
export type NewReaction = InferInsertModel<typeof reactions>;
export type Campaign = InferSelectModel<typeof campaigns>;
export type NewCampaign = InferInsertModel<typeof campaigns>;
export type CommunityNeed = InferSelectModel<typeof communityNeeds>;
export type NewCommunityNeed = InferInsertModel<typeof communityNeeds>;
export type NeedSearchLog = InferSelectModel<typeof needSearchLogs>;
export type NewNeedSearchLog = InferInsertModel<typeof needSearchLogs>;
