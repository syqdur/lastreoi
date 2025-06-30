import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Root admin table for super admin access
export const rootAdmins = pgTable("root_admins", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Galleries table to track all galleries
export const galleries = pgTable("galleries", {
  id: serial("id").primaryKey(),
  firebaseId: text("firebase_id").notNull().unique(),
  slug: text("slug").notNull().unique(),
  eventName: text("event_name").notNull(),
  theme: text("theme").notNull().default("hochzeit"),
  ownerName: text("owner_name"),
  ownerEmail: text("owner_email"),
  password: text("password"),
  description: text("description"),
  eventDate: text("event_date"),
  endDate: text("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
  mediaCount: integer("media_count").default(0),
  visitorCount: integer("visitor_count").default(0),
  planType: text("plan_type").notNull().default("free"), // free, basic, pro
  paymentStatus: text("payment_status").default("unpaid"), // unpaid, paid, expired
  paymentDate: timestamp("payment_date"),
  expiryDate: timestamp("expiry_date"),
});

// Platform users table for user management with plans
export const platformUsers = pgTable("platform_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  planType: text("plan_type").notNull().default("free"), // free, basic, pro
  paymentStatus: text("payment_status").default("unpaid"), // unpaid, paid, expired
  createdAt: timestamp("created_at").defaultNow(),
  paymentDate: timestamp("payment_date"),
  expiryDate: timestamp("expiry_date"),
  maxGalleries: integer("max_galleries").default(1),
  maxMediaPerGallery: integer("max_media_per_gallery").default(50),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertRootAdminSchema = createInsertSchema(rootAdmins).pick({
  username: true,
  password: true,
});

export const insertGallerySchema = createInsertSchema(galleries).omit({
  id: true,
  createdAt: true,
  paymentDate: true,
  expiryDate: true,
});

export const insertPlatformUserSchema = createInsertSchema(platformUsers).omit({
  id: true,
  createdAt: true,
  paymentDate: true,
  expiryDate: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertRootAdmin = z.infer<typeof insertRootAdminSchema>;
export type RootAdmin = typeof rootAdmins.$inferSelect;
export type InsertGallery = z.infer<typeof insertGallerySchema>;
export type Gallery = typeof galleries.$inferSelect;
export type InsertPlatformUser = z.infer<typeof insertPlatformUserSchema>;
export type PlatformUser = typeof platformUsers.$inferSelect;
