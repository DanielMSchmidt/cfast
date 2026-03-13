import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
  scope: text("scope"),
  idToken: text("id_token"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const verifications = sqliteTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const passkeys = sqliteTable("passkeys", {
  id: text("id").primaryKey(),
  name: text("name"),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  publicKey: text("public_key").notNull(),
  credentialId: text("credential_id").notNull().unique(),
  counter: integer("counter").notNull().default(0),
  deviceType: text("device_type"),
  backedUp: integer("backed_up", { mode: "boolean" }).default(false),
  transports: text("transports"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const roles = sqliteTable("roles", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["admin", "editor", "author"] }).notNull(),
  grantedBy: text("granted_by").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const posts = sqliteTable("posts", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull().default(""),
  excerpt: text("excerpt"),
  coverImageKey: text("cover_image_key"),
  authorId: text("author_id").notNull().references(() => users.id),
  published: integer("published", { mode: "boolean" }).notNull().default(false),
  publishedAt: integer("published_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const comments = sqliteTable("comments", {
  id: text("id").primaryKey(),
  postId: text("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  authorId: text("author_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const impersonationLogs = sqliteTable("impersonation_logs", {
  id: text("id").primaryKey(),
  adminId: text("admin_id").notNull().references(() => users.id),
  targetUserId: text("target_user_id").notNull().references(() => users.id),
  startedAt: integer("started_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  endedAt: integer("ended_at", { mode: "timestamp" }),
});

export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  metadata: text("metadata"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});
