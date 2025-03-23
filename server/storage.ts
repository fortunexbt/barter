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
  searchUsers(searchTerm: string, limit?: number): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  
  // Commodity related
  getCommodity(id: number): Promise<Commodity | undefined>;
  getCommodities(limit?: number): Promise<Commodity[]>;
  getCommoditiesByOwner(ownerId: number): Promise<Commodity[]>;
  searchCommodities(searchTerm: string, limit?: number): Promise<Commodity[]>;
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
    // Add demo users
    const demoUsers: InsertUser[] = [
      {
        username: "demo_seller",
        password: "$2b$10$UfRxM/1czfWvxz4ChimK3uRvkQFfRxRLJdSgZRzKIzXb5JnxLALEW", // "password"
        fullName: "Sarah Johnson",
        email: "sarahjohnson@example.com",
        role: "trader",
        accountLevel: "premium",
        kycStatus: "pending",
        profileImage: "https://randomuser.me/api/portraits/women/1.jpg",
        walletAddress: "0x58b9Ce2C10fdD7882abeF545E880387C714c8F7E"
      },
      {
        username: "demo_buyer",
        password: "$2b$10$UfRxM/1czfWvxz4ChimK3uRvkQFfRxRLJdSgZRzKIzXb5JnxLALEW", // "password"
        fullName: "Michael Chen",
        email: "michaelchen@example.com",
        role: "buyer",
        accountLevel: "standard",
        kycStatus: "verified",
        profileImage: "https://randomuser.me/api/portraits/men/2.jpg",
        walletAddress: "0xAb3Cc87F22E27b0d7c5a312F058fcb77B74A92A2"
      },
      {
        username: "demo_broker",
        password: "$2b$10$UfRxM/1czfWvxz4ChimK3uRvkQFfRxRLJdSgZRzKIzXb5JnxLALEW", // "password"
        fullName: "Olivia Martinez",
        email: "oliviamartinez@example.com",
        role: "broker",
        accountLevel: "premium",
        kycStatus: "verified",
        profileImage: "https://randomuser.me/api/portraits/women/3.jpg",
        walletAddress: "0x6C2fE7E90D13B48B22B39A394e5AaFCD2b6fA12A"
      },
      {
        username: "admin",
        password: "$2b$10$UfRxM/1czfWvxz4ChimK3uRvkQFfRxRLJdSgZRzKIzXb5JnxLALEW", // "admin123" (using same hash as demo accounts for simplicity)
        fullName: "Admin User",
        email: "admin@bartertrade.com",
        role: "admin",
        accountLevel: "admin",
        kycStatus: "verified",
        profileImage: "https://randomuser.me/api/portraits/lego/1.jpg",
        walletAddress: "0x0000000000000000000000000000000000000000"
      }
    ];
    
    // Add demo users to storage
    for (const user of demoUsers) {
      const id = this.userIdCounter++;
      const now = new Date();
      this.usersMap.set(id, {
        ...user,
        id,
        tradingSince: now,
        verificationLevel: "full",
        creditScore: 85,
        preferredCurrency: "USD",
        address: "123 Trade Plaza, New York, NY",
        phone: "+1 (555) 123-4567"
      });
    }
    
    // Add demo commodities
    const demoCommodities: InsertCommodity[] = [
      {
        name: "Premium Grade Coffee Beans",
        description: "Organic Arabica coffee beans from Colombian highlands. Certified fair trade and sustainably grown.",
        ownerId: 1, // Sarah Johnson
        price: 8.95,
        priceUnit: "lb",
        volume: 2000,
        volumeUnit: "lb",
        category: "agricultural",
        subcategory: "coffee",
        grade: "AA",
        origin: "Colombia",
        imageUrl: "https://images.unsplash.com/photo-1599639668525-f8be7359a37c?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=500",
        status: "available",
        icon: "coffee",
        iconBg: "amber"
      },
      {
        name: "Industrial Grade Copper",
        description: "High purity (99.9%) electrolytic copper cathodes suitable for industrial applications and electronics manufacturing.",
        ownerId: 1, // Sarah Johnson
        price: 4.25,
        priceUnit: "kg",
        volume: 5000,
        volumeUnit: "kg",
        category: "metals",
        subcategory: "copper",
        grade: "A",
        origin: "Chile",
        imageUrl: "https://images.unsplash.com/photo-1604762512526-b7ce34cbdb72?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=500",
        status: "available",
        icon: "shapes",
        iconBg: "orange"
      },
      {
        name: "Natural Gas Futures",
        description: "Natural Gas futures contracts for December delivery. Standard industry specifications.",
        ownerId: 3, // Olivia Martinez
        price: 3.82,
        priceUnit: "MMBtu",
        volume: 10000,
        volumeUnit: "MMBtu",
        category: "energy",
        subcategory: "natural_gas",
        grade: "Pipeline Quality",
        origin: "USA",
        imageUrl: "https://images.unsplash.com/photo-1626813969879-8a93e9c3efd2?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=500",
        status: "available",
        icon: "flame",
        iconBg: "blue"
      },
      {
        name: "Premium Cocoa Beans",
        description: "Criollo variety cocoa beans, grown in Ecuador. Organic certified and perfect for premium chocolate production.",
        ownerId: 1, // Sarah Johnson
        price: 12.50,
        priceUnit: "kg",
        volume: 1500,
        volumeUnit: "kg",
        category: "agricultural",
        subcategory: "cocoa",
        grade: "Fine Flavor",
        origin: "Ecuador",
        imageUrl: "https://images.unsplash.com/photo-1635856114922-0206dd94ac96?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=500",
        status: "available",
        icon: "coffee",
        iconBg: "brown"
      },
      {
        name: "Crude Oil",
        description: "Light sweet crude oil suitable for refining into gasoline and other petroleum products.",
        ownerId: 3, // Olivia Martinez
        price: 78.95,
        priceUnit: "barrel",
        volume: 1000,
        volumeUnit: "barrel",
        category: "energy",
        subcategory: "crude_oil",
        grade: "WTI",
        origin: "United States",
        imageUrl: "https://images.unsplash.com/photo-1611273426858-450e7f08d304?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=500",
        status: "available",
        icon: "droplet",
        iconBg: "slate"
      }
    ];
    
    // Add demo commodities to storage
    for (const commodity of demoCommodities) {
      const id = this.commodityIdCounter++;
      const now = new Date();
      this.commoditiesMap.set(id, {
        ...commodity,
        id,
        createdAt: now,
        certifications: ["ISO9001", "Organic"],
        marketTrend: "stable",
        contractAddress: `0x${Math.random().toString(16).substring(2, 38)}`
      });
    }
    
    // Add demo barter offers
    const demoBarterOffers: InsertBarterOffer[] = [
      {
        offererId: 1,
        offeredCommodityId: 1,
        desiredCommodityId: 3,
        offerVolume: 500,
        desiredVolume: 2000,
        status: "active",
        expirationDate: new Date(new Date().setDate(new Date().getDate() + 30)), // 30 days from now
      },
      {
        offererId: 3,
        offeredCommodityId: 3,
        desiredCommodityId: 2,
        offerVolume: 2000,
        desiredVolume: 1000,
        status: "active",
        expirationDate: new Date(new Date().setDate(new Date().getDate() + 15)), // 15 days from now
      }
    ];
    
    // Add demo barter offers to storage
    for (const offer of demoBarterOffers) {
      const id = this.barterIdCounter++;
      const now = new Date();
      this.barterOffersMap.set(id, {
        ...offer,
        id,
        createdAt: now,
        barterRatio: 1.5,
        matchScore: 85,
      });
    }
    
    // Add demo contracts
    const demoContracts: InsertContract[] = [
      {
        sellerId: 1,
        buyerId: 2,
        commodityId: 4,
        contractType: "purchase",
        amount: 10000,
        quantity: 800,
        status: "active",
        paymentTerms: "net30",
        deliveryDate: new Date(new Date().setDate(new Date().getDate() + 14)), // 14 days from now
      }
    ];
    
    // Add demo contracts to storage
    for (const contract of demoContracts) {
      const id = this.contractIdCounter++;
      const now = new Date();
      this.contractsMap.set(id, {
        ...contract,
        id,
        createdAt: now,
        updatedAt: now,
        smartContractAddress: `0x${Math.random().toString(16).substring(2, 38)}`,
        deliveryMethod: "shipping",
        termsHash: `0x${Math.random().toString(16).substring(2, 38)}`,
        documents: ["purchase_order.pdf", "quality_certificate.pdf"]
      });
    }
    
    // Add demo notifications
    const demoNotifications: InsertNotification[] = [
      {
        userId: 1,
        type: "system",
        title: "Welcome to BarterTrade",
        message: "Thank you for joining BarterTrade! Your account is now active and ready for trading.",
        isRead: false,
      },
      {
        userId: 1,
        type: "kyc",
        title: "KYC Verification Complete",
        message: "Your KYC verification has been approved. You now have full access to all trading features.",
        isRead: false,
      },
      {
        userId: 2,
        type: "system",
        title: "Welcome to BarterTrade",
        message: "Thank you for joining BarterTrade! Your account is now active and ready for trading.",
        isRead: true,
      },
      {
        userId: 2,
        type: "kyc",
        title: "KYC Verification Complete",
        message: "Your KYC verification has been approved. You now have full access to all trading features.",
        isRead: true,
      },
      {
        userId: 3,
        type: "system",
        title: "Welcome to BarterTrade",
        message: "Thank you for joining BarterTrade! Your account is now active and ready for trading.",
        isRead: true,
      },
      {
        userId: 3,
        type: "kyc",
        title: "KYC Verification Complete",
        message: "Your KYC verification has been approved. You now have full access to all trading features.",
        isRead: true,
      }
    ];
    
    // Add demo notifications to storage
    for (const notification of demoNotifications) {
      const id = this.notificationIdCounter++;
      const now = new Date();
      this.notificationsMap.set(id, {
        ...notification,
        id,
        createdAt: now,
      });
    }
    
    // Add demo KYC documents
    const demoKycDocuments: InsertKycDocument[] = [
      {
        userId: 1,
        documentType: "identity_card",
        documentNumber: "ID12345678",
        status: "verified",
        fileUrl: "/demo/kyc/id_demo.jpg",
      },
      {
        userId: 2,
        documentType: "passport",
        documentNumber: "P98765432",
        status: "verified",
        fileUrl: "/demo/kyc/passport_demo.jpg",
      },
      {
        userId: 3,
        documentType: "driver_license",
        documentNumber: "DL876543210",
        status: "verified",
        fileUrl: "/demo/kyc/license_demo.jpg",
      }
    ];
    
    // Add demo KYC documents to storage
    for (const kycDoc of demoKycDocuments) {
      const id = this.kycDocumentIdCounter++;
      const now = new Date();
      this.kycDocumentsMap.set(id, {
        ...kycDoc,
        id,
        uploadedAt: now,
        verifiedAt: now,
        verifiedBy: "system",
      });
    }
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
  
  async searchUsers(searchTerm: string, limit?: number): Promise<User[]> {
    // Filter users whose username, fullName, or email contains the search term
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    const matchingUsers = Array.from(this.usersMap.values()).filter(user => 
      user.username.toLowerCase().includes(lowerSearchTerm) ||
      (user.fullName && user.fullName.toLowerCase().includes(lowerSearchTerm)) ||
      user.email.toLowerCase().includes(lowerSearchTerm)
    );
    
    // Apply limit if provided
    if (limit && limit > 0) {
      return matchingUsers.slice(0, limit);
    }
    
    return matchingUsers;
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    
    // Set users with kycStatus pending by default
    const user: User = { 
      ...insertUser, 
      id, 
      tradingSince: now,
      kycStatus: "pending", // Default to pending KYC status
      accountLevel: "basic",
      role: "trader",
      profileImage: null,
      identityCommitment: null,
      zkpIdentity: null,
      zkpVerified: null,
    };
    
    this.usersMap.set(id, user);
    
    // No longer auto-create KYC documents
    
    // Create welcome notification only
    const welcomeNotifId = this.notificationIdCounter++;
    this.notificationsMap.set(welcomeNotifId, {
      id: welcomeNotifId,
      userId: id,
      type: "system",
      title: "Welcome to BarterTrade",
      message: "Thank you for joining BarterTrade! Please complete KYC verification to unlock all features.",
      isRead: false,
      createdAt: now,
    });
    
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
  
  async searchCommodities(searchTerm: string, limit?: number): Promise<Commodity[]> {
    // Filter commodities whose name, grade, status, or icon contains the search term
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    const matchingCommodities = Array.from(this.commoditiesMap.values()).filter(commodity => 
      commodity.name.toLowerCase().includes(lowerSearchTerm) ||
      commodity.grade.toLowerCase().includes(lowerSearchTerm) ||
      (commodity.status && commodity.status.toLowerCase().includes(lowerSearchTerm)) ||
      (commodity.icon && commodity.icon.toLowerCase().includes(lowerSearchTerm))
    );
    
    // Apply limit if provided
    if (limit && limit > 0) {
      return matchingCommodities.slice(0, limit);
    }
    
    return matchingCommodities;
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
        
        // Create KYC success notification
        const kycNotifId = this.notificationIdCounter++;
        this.notificationsMap.set(kycNotifId, {
          id: kycNotifId,
          userId: user.id,
          type: "kyc",
          title: "KYC Verification Complete",
          message: "Your KYC verification has been approved. You now have full access to all trading features.",
          isRead: false,
          createdAt: new Date(),
        });
      }
    }
    
    return updatedDocument;
  }
}

// Use PostgreSQL storage implementation
import { storage as pgStorage } from "./db-storage";

// Export the PostgreSQL storage as the storage instance
export const storage = pgStorage;
