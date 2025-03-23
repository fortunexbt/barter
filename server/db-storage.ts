import { eq, or, ilike } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { 
  users, commodities, barterOffers, contracts, 
  transactions, notifications, kycDocuments,
  type User, type InsertUser, type Commodity, 
  type InsertCommodity, type BarterOffer, 
  type InsertBarterOffer, type Contract, 
  type InsertContract, type Transaction, 
  type InsertTransaction, type Notification, 
  type InsertNotification, type KycDocument, 
  type InsertKycDocument
} from "@shared/schema";
import session from "express-session";
import memoryStore from "memorystore";
import { IStorage } from "./storage";

// Create a PostgreSQL client for the database
// Create the postgres client with proper SSL configuration for cloud databases
const queryClient = postgres(process.env.DATABASE_URL || '', { 
  ssl: 'require',
  max: 10, // Connection pool size
  idle_timeout: 20 // Auto-close idle connections after 20 seconds
});

// Initialize Drizzle with the PostgreSQL client
const db = drizzle(queryClient);

// Create a memory-based session store for development/testing
const MemoryStore = memoryStore(session);

export class PostgresStorage implements IStorage {
  sessionStore: any; // Using any type to avoid SessionStore type issues

  constructor() {
    // Use memory store for sessions as a temporary solution
    // In production, you'd want to use a proper PostgreSQL-backed session store
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
  }

  // User related methods
  async getUser(id: number): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.id, id));
    return results[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.username, username));
    return results[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.email, email));
    return results[0];
  }
  
  async searchUsers(searchTerm: string, limit?: number): Promise<User[]> {
    // Create the search pattern for SQL LIKE operations
    const searchPattern = `%${searchTerm}%`;
    
    // Due to limitations with ilike in our version of drizzle-orm, 
    // we'll use a raw SQL query for search functionality
    const query = `
      SELECT * FROM users 
      WHERE username ILIKE $1 
      OR "fullName" ILIKE $1 
      OR email ILIKE $1
      ${limit ? `LIMIT ${limit}` : ''}
    `;
    
    // Execute the query with the searchPattern parameter
    const results = await queryClient.unsafe(query, [searchPattern]);
    return results as User[];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const results = await db.insert(users).values(insertUser).returning();
    return results[0];
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const results = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return results[0];
  }

  // Commodity related methods
  async getCommodity(id: number): Promise<Commodity | undefined> {
    const results = await db.select().from(commodities).where(eq(commodities.id, id));
    return results[0];
  }

  async getCommodities(limit?: number): Promise<Commodity[]> {
    let query = db.select().from(commodities);
    if (limit) {
      query = query.limit(limit);
    }
    return await query;
  }

  async getCommoditiesByOwner(ownerId: number): Promise<Commodity[]> {
    return await db.select().from(commodities).where(eq(commodities.ownerId, ownerId));
  }
  
  async searchCommodities(searchTerm: string, limit?: number): Promise<Commodity[]> {
    // Create the search pattern for SQL LIKE operations
    const searchPattern = `%${searchTerm}%`;
    
    // Due to limitations with ilike in our version of drizzle-orm,
    // we'll use a raw SQL query for search functionality
    const query = `
      SELECT * FROM commodities 
      WHERE name ILIKE $1 
      OR grade ILIKE $1 
      OR status ILIKE $1
      OR icon ILIKE $1
      ${limit ? `LIMIT ${limit}` : ''}
    `;
    
    // Execute the query with the searchPattern parameter
    const results = await queryClient.unsafe(query, [searchPattern]);
    return results as Commodity[];
  }

  async createCommodity(insertCommodity: InsertCommodity): Promise<Commodity> {
    const results = await db.insert(commodities).values(insertCommodity).returning();
    return results[0];
  }

  async updateCommodity(id: number, commodityData: Partial<Commodity>): Promise<Commodity | undefined> {
    const results = await db.update(commodities)
      .set(commodityData)
      .where(eq(commodities.id, id))
      .returning();
    return results[0];
  }

  async deleteCommodity(id: number): Promise<boolean> {
    const results = await db.delete(commodities).where(eq(commodities.id, id)).returning();
    return results.length > 0;
  }

  // Barter related methods
  async getBarterOffer(id: number): Promise<BarterOffer | undefined> {
    const results = await db.select().from(barterOffers).where(eq(barterOffers.id, id));
    return results[0];
  }

  async getBarterOffersByUser(userId: number): Promise<BarterOffer[]> {
    return await db.select().from(barterOffers)
      .where(eq(barterOffers.offeringUserId, userId));
  }

  async createBarterOffer(insertBarterOffer: InsertBarterOffer): Promise<BarterOffer> {
    const results = await db.insert(barterOffers).values(insertBarterOffer).returning();
    return results[0];
  }

  async updateBarterOffer(id: number, barterOfferData: Partial<BarterOffer>): Promise<BarterOffer | undefined> {
    const results = await db.update(barterOffers)
      .set(barterOfferData)
      .where(eq(barterOffers.id, id))
      .returning();
    return results[0];
  }

  async deleteBarterOffer(id: number): Promise<boolean> {
    const results = await db.delete(barterOffers).where(eq(barterOffers.id, id)).returning();
    return results.length > 0;
  }

  // Contract related methods
  async getContract(id: number): Promise<Contract | undefined> {
    const results = await db.select().from(contracts).where(eq(contracts.id, id));
    return results[0];
  }

  async getContractsByUser(userId: number): Promise<Contract[]> {
    return await db.select().from(contracts)
      .where(
        or(
          eq(contracts.buyerId, userId),
          eq(contracts.sellerId, userId)
        )
      );
  }

  async createContract(insertContract: InsertContract): Promise<Contract> {
    const results = await db.insert(contracts).values(insertContract).returning();
    return results[0];
  }

  async updateContract(id: number, contractData: Partial<Contract>): Promise<Contract | undefined> {
    const results = await db.update(contracts)
      .set(contractData)
      .where(eq(contracts.id, id))
      .returning();
    return results[0];
  }

  // Transaction related methods
  async getTransaction(id: number): Promise<Transaction | undefined> {
    const results = await db.select().from(transactions).where(eq(transactions.id, id));
    return results[0];
  }

  async getTransactionsByUser(userId: number): Promise<Transaction[]> {
    return await db.select().from(transactions)
      .where(
        or(
          eq(transactions.senderId, userId),
          eq(transactions.receiverId, userId)
        )
      );
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const results = await db.insert(transactions).values(insertTransaction).returning();
    return results[0];
  }

  // Notification related methods
  async getNotification(id: number): Promise<Notification | undefined> {
    const results = await db.select().from(notifications).where(eq(notifications.id, id));
    return results[0];
  }

  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    return await db.select().from(notifications).where(eq(notifications.userId, userId));
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const results = await db.insert(notifications).values(insertNotification).returning();
    return results[0];
  }

  async markNotificationAsRead(id: number): Promise<boolean> {
    const results = await db.update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id))
      .returning();
    return results.length > 0;
  }

  // KYC document related methods
  async getKycDocument(id: number): Promise<KycDocument | undefined> {
    const results = await db.select().from(kycDocuments).where(eq(kycDocuments.id, id));
    return results[0];
  }

  async getKycDocumentsByUser(userId: number): Promise<KycDocument[]> {
    return await db.select().from(kycDocuments).where(eq(kycDocuments.userId, userId));
  }

  async createKycDocument(insertKycDocument: InsertKycDocument): Promise<KycDocument> {
    const results = await db.insert(kycDocuments).values(insertKycDocument).returning();
    return results[0];
  }

  async verifyKycDocument(id: number): Promise<KycDocument | undefined> {
    const results = await db.update(kycDocuments)
      .set({ verified: true })
      .where(eq(kycDocuments.id, id))
      .returning();
    return results[0];
  }
}

// Export the PostgresStorage as the storage instance
export const storage = new PostgresStorage();