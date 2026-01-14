import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * NanaBanana Accounts table - stores accounts created for users
 */
export const nanaBananaAccounts = mysqlTable("nanaBanana_accounts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  sessionToken: text("sessionToken").notNull(),
  useCount: int("useCount").default(0).notNull(),
  maxUses: int("maxUses").default(5).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NanaBananaAccount = typeof nanaBananaAccounts.$inferSelect;
export type InsertNanaBananaAccount = typeof nanaBananaAccounts.$inferInsert;

/**
 * Image Generation Tasks table - tracks image generation/editing tasks
 */
export const imageGenerationTasks = mysqlTable("image_generation_tasks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  accountId: int("accountId").notNull(),
  taskId: varchar("taskId", { length: 255 }).notNull().unique(),
  prompt: text("prompt").notNull(),
  imageUrls: json("imageUrls"),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  resultUrl: text("resultUrl"),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ImageGenerationTask = typeof imageGenerationTasks.$inferSelect;
export type InsertImageGenerationTask = typeof imageGenerationTasks.$inferInsert;

/**
 * Generated Images table - stores metadata of generated images
 */
export const generatedImages = mysqlTable("generated_images", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  taskId: int("taskId").notNull(),
  prompt: text("prompt").notNull(),
  imageUrl: text("imageUrl").notNull(),
  s3Key: varchar("s3Key", { length: 512 }).notNull(),
  s3Url: text("s3Url").notNull(),
  isEdited: boolean("isEdited").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GeneratedImage = typeof generatedImages.$inferSelect;
export type InsertGeneratedImage = typeof generatedImages.$inferInsert;

/**
 * Uploaded Images table - stores metadata of user-uploaded images for editing
 */
export const uploadedImages = mysqlTable("uploaded_images", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  s3Key: varchar("s3Key", { length: 512 }).notNull(),
  s3Url: text("s3Url").notNull(),
  mimeType: varchar("mimeType", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UploadedImage = typeof uploadedImages.$inferSelect;
export type InsertUploadedImage = typeof uploadedImages.$inferInsert;

/**
 * Relations
 */
export const usersRelations = relations(users, ({ many }) => ({
  nanaBananaAccounts: many(nanaBananaAccounts),
  imageGenerationTasks: many(imageGenerationTasks),
  generatedImages: many(generatedImages),
  uploadedImages: many(uploadedImages),
}));

export const nanaBananaAccountsRelations = relations(nanaBananaAccounts, ({ one }) => ({
  user: one(users, {
    fields: [nanaBananaAccounts.userId],
    references: [users.id],
  }),
}));

export const imageGenerationTasksRelations = relations(imageGenerationTasks, ({ one }) => ({
  user: one(users, {
    fields: [imageGenerationTasks.userId],
    references: [users.id],
  }),
  account: one(nanaBananaAccounts, {
    fields: [imageGenerationTasks.accountId],
    references: [nanaBananaAccounts.id],
  }),
}));

export const generatedImagesRelations = relations(generatedImages, ({ one }) => ({
  user: one(users, {
    fields: [generatedImages.userId],
    references: [users.id],
  }),
}));

export const uploadedImagesRelations = relations(uploadedImages, ({ one }) => ({
  user: one(users, {
    fields: [uploadedImages.userId],
    references: [users.id],
  }),
}));
