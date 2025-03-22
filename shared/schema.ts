import { pgTable, text, serial, integer, boolean, jsonb, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").default("trader"),
  kycStatus: text("kyc_status").default("pending"),
  accountLevel: text("account_level").default("standard"),
  tradingSince: timestamp("trading_since").defaultNow(),
  profileImage: text("profile_image").default(""),
});

// Commodities table
export const commodities = pgTable("commodities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  grade: text("grade").notNull(),
  price: doublePrecision("price").notNull(),
  priceUnit: text("price_unit").notNull(), // e.g., per ton, per barrel
  volume: doublePrecision("volume").notNull(),
  volumeUnit: text("volume_unit").notNull(), // e.g., tons, barrels
  ownerId: integer("owner_id").notNull(),
  status: text("status").default("available"), // available, bidding, sold
  createdAt: timestamp("created_at").defaultNow(),
  icon: text("icon").default("agriculture"), // Material icon name
  iconBg: text("icon_bg").default("primary"), // Icon background color
});

// Barter offers table
export const barterOffers = pgTable("barter_offers", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  offeringCommodityId: integer("offering_commodity_id").notNull(),
  requestingCommodityId: integer("requesting_commodity_id").notNull(),
  offeringUserId: integer("offering_user_id").notNull(),
  requestingUserId: integer("requesting_user_id").notNull(),
  valueMatch: integer("value_match").notNull(), // percentage match of value
  status: text("status").default("pending"), // pending, accepted, rejected
  createdAt: timestamp("created_at").defaultNow(),
});

// Contracts table
export const contracts = pgTable("contracts", {
  id: serial("id").primaryKey(),
  contractNumber: text("contract_number").notNull().unique(),
  title: text("title").notNull(),
  sellerId: integer("seller_id").notNull(),
  buyerId: integer("buyer_id").notNull(),
  commodityId: integer("commodity_id").notNull(),
  quantity: doublePrecision("quantity").notNull(),
  price: doublePrecision("price").notNull(),
  terms: text("terms").notNull(),
  status: text("status").default("pending"), // pending, signed, completed, cancelled
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Transactions table
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // trade, barter
  senderId: integer("sender_id").notNull(),
  receiverId: integer("receiver_id").notNull(),
  commodityId: integer("commodity_id"),
  barterId: integer("barter_id"),
  contractId: integer("contract_id"),
  amount: doublePrecision("amount"),
  status: text("status").notNull(), // pending, completed, failed
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // price_alert, contract, barter
  read: boolean("read").default(false),
  icon: text("icon").default("notifications"),
  iconBg: text("icon_bg").default("info"),
  createdAt: timestamp("created_at").defaultNow(),
});

// KYC Documents table
export const kycDocuments = pgTable("kyc_documents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  documentType: text("document_type").notNull(), // id, passport, driving_license
  documentNumber: text("document_number").notNull(),
  verified: boolean("verified").default(false),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// Define insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertCommoditySchema = createInsertSchema(commodities).omit({ id: true, createdAt: true });
export const insertBarterOfferSchema = createInsertSchema(barterOffers).omit({ id: true, createdAt: true });
export const insertContractSchema = createInsertSchema(contracts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, createdAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export const insertKycDocumentSchema = createInsertSchema(kycDocuments).omit({ id: true, uploadedAt: true });

// Define types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCommodity = z.infer<typeof insertCommoditySchema>;
export type Commodity = typeof commodities.$inferSelect;

export type InsertBarterOffer = z.infer<typeof insertBarterOfferSchema>;
export type BarterOffer = typeof barterOffers.$inferSelect;

export type InsertContract = z.infer<typeof insertContractSchema>;
export type Contract = typeof contracts.$inferSelect;

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

export type InsertKycDocument = z.infer<typeof insertKycDocumentSchema>;
export type KycDocument = typeof kycDocuments.$inferSelect;

// Auth types
export type LoginData = Pick<InsertUser, "username" | "password">;
