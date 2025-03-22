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
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Define the storage interface
export interface IStorage {
  // User related
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  
  // Commodity related
  getCommodity(id: number): Promise<Commodity | undefined>;
  getCommodities(limit?: number): Promise<Commodity[]>;
  getCommoditiesByOwner(ownerId: number): Promise<Commodity[]>;
  createCommodity(commodity: InsertCommodity): Promise<Commodity>;
  updateCommodity(id: number, commodityData: Partial<Commodity>): Promise<Commodity | undefined>;
  deleteCommodity(id: number): Promise<boolean>;
  
  // Barter related
  getBarterOffer(id: number): Promise<BarterOffer | undefined>;
  getBarterOffersByUser(userId: number): Promise<BarterOffer[]>;
  createBarterOffer(barterOffer: InsertBarterOffer): Promise<BarterOffer>;
  updateBarterOffer(id: number, barterOfferData: Partial<BarterOffer>): Promise<BarterOffer | undefined>;
  deleteBarterOffer(id: number): Promise<boolean>;
  
  // Contract related
  getContract(id: number): Promise<Contract | undefined>;
  getContractsByUser(userId: number): Promise<Contract[]>;
  createContract(contract: InsertContract): Promise<Contract>;
  updateContract(id: number, contractData: Partial<Contract>): Promise<Contract | undefined>;
  
  // Transaction related
  getTransaction(id: number): Promise<Transaction | undefined>;
  getTransactionsByUser(userId: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  
  // Notification related
  getNotification(id: number): Promise<Notification | undefined>;
  getNotificationsByUser(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<boolean>;
  
  // KYC related
  getKycDocument(id: number): Promise<KycDocument | undefined>;
  getKycDocumentsByUser(userId: number): Promise<KycDocument[]>;
  createKycDocument(kycDocument: InsertKycDocument): Promise<KycDocument>;
  verifyKycDocument(id: number): Promise<KycDocument | undefined>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private usersMap: Map<number, User>;
  private commoditiesMap: Map<number, Commodity>;
  private barterOffersMap: Map<number, BarterOffer>;
  private contractsMap: Map<number, Contract>;
  private transactionsMap: Map<number, Transaction>;
  private notificationsMap: Map<number, Notification>;
  private kycDocumentsMap: Map<number, KycDocument>;
  
  sessionStore: session.SessionStore;
  
  private userIdCounter: number;
  private commodityIdCounter: number;
  private barterIdCounter: number;
  private contractIdCounter: number;
  private transactionIdCounter: number;
  private notificationIdCounter: number;
  private kycDocumentIdCounter: number;
  
  constructor() {
    this.usersMap = new Map();
    this.commoditiesMap = new Map();
    this.barterOffersMap = new Map();
    this.contractsMap = new Map();
    this.transactionsMap = new Map();
    this.notificationsMap = new Map();
    this.kycDocumentsMap = new Map();
    
    this.userIdCounter = 1;
    this.commodityIdCounter = 1;
    this.barterIdCounter = 1;
    this.contractIdCounter = 1;
    this.transactionIdCounter = 1;
    this.notificationIdCounter = 1;
    this.kycDocumentIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    
    // Initialize with demo data
    this.initializeDemoData();
  }
  
  private initializeDemoData() {
    // Add some initial data for demo purposes
    // This would be removed in a production environment
  }
  
  // User related methods
  async getUser(id: number): Promise<User | undefined> {
    return this.usersMap.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(
      (user) => user.email === email,
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      tradingSince: now,
    };
    this.usersMap.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.usersMap.set(id, updatedUser);
    return updatedUser;
  }
  
  // Commodity related methods
  async getCommodity(id: number): Promise<Commodity | undefined> {
    return this.commoditiesMap.get(id);
  }
  
  async getCommodities(limit?: number): Promise<Commodity[]> {
    const commodities = Array.from(this.commoditiesMap.values());
    if (limit) {
      return commodities.slice(0, limit);
    }
    return commodities;
  }
  
  async getCommoditiesByOwner(ownerId: number): Promise<Commodity[]> {
    return Array.from(this.commoditiesMap.values()).filter(
      (commodity) => commodity.ownerId === ownerId,
    );
  }
  
  async createCommodity(insertCommodity: InsertCommodity): Promise<Commodity> {
    const id = this.commodityIdCounter++;
    const now = new Date();
    const commodity: Commodity = {
      ...insertCommodity,
      id,
      createdAt: now,
    };
    this.commoditiesMap.set(id, commodity);
    return commodity;
  }
  
  async updateCommodity(id: number, commodityData: Partial<Commodity>): Promise<Commodity | undefined> {
    const commodity = await this.getCommodity(id);
    if (!commodity) return undefined;
    
    const updatedCommodity = { ...commodity, ...commodityData };
    this.commoditiesMap.set(id, updatedCommodity);
    return updatedCommodity;
  }
  
  async deleteCommodity(id: number): Promise<boolean> {
    return this.commoditiesMap.delete(id);
  }
  
  // Barter related methods
  async getBarterOffer(id: number): Promise<BarterOffer | undefined> {
    return this.barterOffersMap.get(id);
  }
  
  async getBarterOffersByUser(userId: number): Promise<BarterOffer[]> {
    return Array.from(this.barterOffersMap.values()).filter(
      (offer) => offer.offeringUserId === userId || offer.requestingUserId === userId,
    );
  }
  
  async createBarterOffer(insertBarterOffer: InsertBarterOffer): Promise<BarterOffer> {
    const id = this.barterIdCounter++;
    const now = new Date();
    const barterOffer: BarterOffer = {
      ...insertBarterOffer,
      id,
      createdAt: now,
    };
    this.barterOffersMap.set(id, barterOffer);
    return barterOffer;
  }
  
  async updateBarterOffer(id: number, barterOfferData: Partial<BarterOffer>): Promise<BarterOffer | undefined> {
    const barterOffer = await this.getBarterOffer(id);
    if (!barterOffer) return undefined;
    
    const updatedBarterOffer = { ...barterOffer, ...barterOfferData };
    this.barterOffersMap.set(id, updatedBarterOffer);
    return updatedBarterOffer;
  }
  
  async deleteBarterOffer(id: number): Promise<boolean> {
    return this.barterOffersMap.delete(id);
  }
  
  // Contract related methods
  async getContract(id: number): Promise<Contract | undefined> {
    return this.contractsMap.get(id);
  }
  
  async getContractsByUser(userId: number): Promise<Contract[]> {
    return Array.from(this.contractsMap.values()).filter(
      (contract) => contract.sellerId === userId || contract.buyerId === userId,
    );
  }
  
  async createContract(insertContract: InsertContract): Promise<Contract> {
    const id = this.contractIdCounter++;
    const now = new Date();
    const contractNumber = `CT-${String(id).padStart(4, '0')}`;
    const contract: Contract = {
      ...insertContract,
      id,
      contractNumber,
      createdAt: now,
      updatedAt: now,
    };
    this.contractsMap.set(id, contract);
    return contract;
  }
  
  async updateContract(id: number, contractData: Partial<Contract>): Promise<Contract | undefined> {
    const contract = await this.getContract(id);
    if (!contract) return undefined;
    
    const updatedContract = { 
      ...contract, 
      ...contractData,
      updatedAt: new Date(),
    };
    this.contractsMap.set(id, updatedContract);
    return updatedContract;
  }
  
  // Transaction related methods
  async getTransaction(id: number): Promise<Transaction | undefined> {
    return this.transactionsMap.get(id);
  }
  
  async getTransactionsByUser(userId: number): Promise<Transaction[]> {
    return Array.from(this.transactionsMap.values()).filter(
      (transaction) => transaction.senderId === userId || transaction.receiverId === userId,
    );
  }
  
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.transactionIdCounter++;
    const now = new Date();
    const transaction: Transaction = {
      ...insertTransaction,
      id,
      createdAt: now,
    };
    this.transactionsMap.set(id, transaction);
    return transaction;
  }
  
  // Notification related methods
  async getNotification(id: number): Promise<Notification | undefined> {
    return this.notificationsMap.get(id);
  }
  
  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    return Array.from(this.notificationsMap.values())
      .filter((notification) => notification.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = this.notificationIdCounter++;
    const now = new Date();
    const notification: Notification = {
      ...insertNotification,
      id,
      createdAt: now,
    };
    this.notificationsMap.set(id, notification);
    return notification;
  }
  
  async markNotificationAsRead(id: number): Promise<boolean> {
    const notification = await this.getNotification(id);
    if (!notification) return false;
    
    notification.read = true;
    this.notificationsMap.set(id, notification);
    return true;
  }
  
  // KYC related methods
  async getKycDocument(id: number): Promise<KycDocument | undefined> {
    return this.kycDocumentsMap.get(id);
  }
  
  async getKycDocumentsByUser(userId: number): Promise<KycDocument[]> {
    return Array.from(this.kycDocumentsMap.values()).filter(
      (document) => document.userId === userId,
    );
  }
  
  async createKycDocument(insertKycDocument: InsertKycDocument): Promise<KycDocument> {
    const id = this.kycDocumentIdCounter++;
    const now = new Date();
    const kycDocument: KycDocument = {
      ...insertKycDocument,
      id,
      uploadedAt: now,
    };
    this.kycDocumentsMap.set(id, kycDocument);
    return kycDocument;
  }
  
  async verifyKycDocument(id: number): Promise<KycDocument | undefined> {
    const kycDocument = await this.getKycDocument(id);
    if (!kycDocument) return undefined;
    
    const updatedDocument = { ...kycDocument, verified: true };
    this.kycDocumentsMap.set(id, updatedDocument);
    
    // Update user KYC status if all documents are verified
    const userDocuments = await this.getKycDocumentsByUser(kycDocument.userId);
    const allVerified = userDocuments.every(doc => doc.verified);
    
    if (allVerified) {
      const user = await this.getUser(kycDocument.userId);
      if (user) {
        await this.updateUser(user.id, { kycStatus: "verified" });
      }
    }
    
    return updatedDocument;
  }
}

export const storage = new MemStorage();
