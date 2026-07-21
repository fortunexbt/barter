import { pgTable, text, serial, integer, boolean, jsonb, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("trader"),
  kycStatus: text("kyc_status").notNull().default("pending"),
  accountLevel: text("account_level").notNull().default("standard"),
  tradingSince: timestamp("trading_since").notNull().defaultNow(),
  profileImage: text("profile_image").notNull().default(""),
  walletAddress: text("wallet_address"),
  verificationLevel: text("verification_level"),
  creditScore: integer("credit_score"),
  preferredCurrency: text("preferred_currency").notNull().default("USD"),
  address: text("address"),
  phone: text("phone"),
  // ZKP identity fields
  identityCommitment: text("identity_commitment"),
  zkpIdentity: text("zkp_identity"),
  zkpVerified: boolean("zkp_verified").default(false),
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
  description: text("description"),
  category: text("category"),
  subcategory: text("subcategory"),
  origin: text("origin"),
  imageUrl: text("image_url"),
  certifications: jsonb("certifications").$type<string[]>().notNull().default([]),
  marketTrend: text("market_trend"),
  contractAddress: text("contract_address"),
  status: text("status").notNull().default("available"), // available, bidding, sold
  createdAt: timestamp("created_at").notNull().defaultNow(),
  icon: text("icon").notNull().default("agriculture"), // Material icon name
  iconBg: text("icon_bg").notNull().default("primary"), // Icon background color
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
  // Legacy prototype aliases retained while the authenticated UI is consolidated.
  offererId: integer("offerer_id"),
  offeredCommodityId: integer("offered_commodity_id"),
  desiredCommodityId: integer("desired_commodity_id"),
  offerVolume: doublePrecision("offer_volume"),
  desiredVolume: doublePrecision("desired_volume"),
  expirationDate: timestamp("expiration_date"),
  barterRatio: doublePrecision("barter_ratio"),
  matchScore: integer("match_score"),
  status: text("status").notNull().default("pending"), // pending, accepted, rejected
  createdAt: timestamp("created_at").notNull().defaultNow(),
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
  amount: doublePrecision("amount"),
  contractType: text("contract_type"),
  paymentTerms: text("payment_terms"),
  deliveryDate: timestamp("delivery_date"),
  smartContractAddress: text("smart_contract_address"),
  deliveryMethod: text("delivery_method"),
  termsHash: text("terms_hash"),
  documents: jsonb("documents").$type<string[]>().notNull().default([]),
  status: text("status").notNull().default("pending"), // pending, signed, completed, cancelled
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Transactions table
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // trade, barter, escrow_creation
  senderId: integer("sender_id").notNull(),
  receiverId: integer("receiver_id").notNull(),
  commodityId: integer("commodity_id"),
  barterId: integer("barter_id"),
  contractId: integer("contract_id"),
  amount: doublePrecision("amount"),
  status: text("status").notNull(), // pending, completed, failed
  createdAt: timestamp("created_at").notNull().defaultNow(),
  metadata: text("metadata"),  // JSON string for blockchain transaction details
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull().default("Protocol notice"),
  message: text("message").notNull(),
  type: text("type").notNull(), // price_alert, contract, barter
  read: boolean("read").notNull().default(false),
  icon: text("icon").notNull().default("notifications"),
  iconBg: text("icon_bg").notNull().default("info"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// KYC Documents table
export const kycDocuments = pgTable("kyc_documents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  documentType: text("document_type").notNull(), // id, passport, driving_license
  documentNumber: text("document_number").notNull(),
  verified: boolean("verified").notNull().default(false),
  status: text("status").notNull().default("pending"),
  fileUrl: text("file_url"),
  verifiedAt: timestamp("verified_at"),
  verifiedBy: text("verified_by"),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  // ZKP verification data
  zkpVerified: boolean("zkp_verified").notNull().default(false),
  verificationProofId: text("verification_proof_id"),
  identityCommitment: text("identity_commitment"),
});

// Define insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertCommoditySchema = createInsertSchema(commodities).omit({ id: true, createdAt: true });
export const insertBarterOfferSchema = createInsertSchema(barterOffers).omit({ id: true, createdAt: true });
export const insertContractSchema = createInsertSchema(contracts).omit({
  id: true,
  contractNumber: true,
  createdAt: true,
  updatedAt: true,
});
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, createdAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export const insertKycDocumentSchema = createInsertSchema(kycDocuments).omit({ id: true, uploadedAt: true });

// Define types
export type InsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertCommodity = typeof commodities.$inferInsert;
export type Commodity = typeof commodities.$inferSelect;

export type InsertBarterOffer = typeof barterOffers.$inferInsert;
export type BarterOffer = typeof barterOffers.$inferSelect;

export type InsertContract = Omit<typeof contracts.$inferInsert, "id" | "contractNumber" | "createdAt" | "updatedAt">;
export type Contract = typeof contracts.$inferSelect;

export type InsertTransaction = typeof transactions.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;

export type InsertNotification = typeof notifications.$inferInsert;
export type Notification = typeof notifications.$inferSelect;

export type InsertKycDocument = typeof kycDocuments.$inferInsert;
export type KycDocument = typeof kycDocuments.$inferSelect;

// Auth types
export type LoginData = Pick<InsertUser, "username" | "password">;
export type PublicUser = Omit<User, "password" | "zkpIdentity">;
