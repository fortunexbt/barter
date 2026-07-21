import {
  type BarterOffer,
  type Commodity,
  type Contract,
  type InsertBarterOffer,
  type InsertCommodity,
  type InsertContract,
  type InsertKycDocument,
  type InsertNotification,
  type InsertTransaction,
  type InsertUser,
  type KycDocument,
  type Notification,
  type Transaction,
  type User,
} from "@shared/schema";
import session, { type Store } from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  searchUsers(searchTerm: string, limit?: number): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;

  getCommodity(id: number): Promise<Commodity | undefined>;
  getCommodities(limit?: number): Promise<Commodity[]>;
  getCommoditiesByOwner(ownerId: number): Promise<Commodity[]>;
  searchCommodities(searchTerm: string, limit?: number): Promise<Commodity[]>;
  createCommodity(commodity: InsertCommodity): Promise<Commodity>;
  updateCommodity(id: number, commodityData: Partial<Commodity>): Promise<Commodity | undefined>;
  deleteCommodity(id: number): Promise<boolean>;

  getBarterOffer(id: number): Promise<BarterOffer | undefined>;
  getBarterOffersByUser(userId: number): Promise<BarterOffer[]>;
  createBarterOffer(barterOffer: InsertBarterOffer): Promise<BarterOffer>;
  updateBarterOffer(
    id: number,
    barterOfferData: Partial<BarterOffer>,
  ): Promise<BarterOffer | undefined>;
  deleteBarterOffer(id: number): Promise<boolean>;

  getContract(id: number): Promise<Contract | undefined>;
  getContractsByUser(userId: number): Promise<Contract[]>;
  createContract(contract: InsertContract): Promise<Contract>;
  updateContract(id: number, contractData: Partial<Contract>): Promise<Contract | undefined>;

  getTransaction(id: number): Promise<Transaction | undefined>;
  getTransactionsByUser(userId: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;

  getNotification(id: number): Promise<Notification | undefined>;
  getNotificationsByUser(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<boolean>;

  getKycDocument(id: number): Promise<KycDocument | undefined>;
  getKycDocumentsByUser(userId: number): Promise<KycDocument[]>;
  createKycDocument(kycDocument: InsertKycDocument): Promise<KycDocument>;
  verifyKycDocument(id: number): Promise<KycDocument | undefined>;

  sessionStore: Store;
}

const FIXTURE_DATE = new Date("2025-03-24T09:00:00.000Z");

function nullable<T>(value: T | null | undefined): T | null {
  return value ?? null;
}

/**
 * In-memory compatibility storage for local exploration of the authenticated
 * prototype. The public protocol lab does not read this data or require auth.
 */
export class MemStorage implements IStorage {
  private usersMap = new Map<number, User>();
  private commoditiesMap = new Map<number, Commodity>();
  private barterOffersMap = new Map<number, BarterOffer>();
  private contractsMap = new Map<number, Contract>();
  private transactionsMap = new Map<number, Transaction>();
  private notificationsMap = new Map<number, Notification>();
  private kycDocumentsMap = new Map<number, KycDocument>();

  sessionStore: Store;

  private userIdCounter = 1;
  private commodityIdCounter = 1;
  private barterIdCounter = 1;
  private contractIdCounter = 1;
  private transactionIdCounter = 1;
  private notificationIdCounter = 1;
  private kycDocumentIdCounter = 1;

  constructor() {
    this.sessionStore = new MemoryStore({ checkPeriod: 86_400_000 });
    this.initializeFixtureData();
  }

  private initializeFixtureData() {
    const fixtureUsers: Array<Omit<User, "id">> = [
      {
        username: "fixture_cooperative",
        password: "!",
        fullName: "Huila Export Cooperative",
        email: "fixture-cooperative@example.invalid",
        role: "trader",
        kycStatus: "fixture",
        accountLevel: "prototype",
        tradingSince: FIXTURE_DATE,
        profileImage: "",
        walletAddress: null,
        verificationLevel: "simulated",
        creditScore: null,
        preferredCurrency: "USD",
        address: null,
        phone: null,
        identityCommitment: null,
        zkpIdentity: null,
        zkpVerified: false,
      },
      {
        username: "fixture_foundry",
        password: "!",
        fullName: "Andes Metals Desk",
        email: "fixture-foundry@example.invalid",
        role: "trader",
        kycStatus: "fixture",
        accountLevel: "prototype",
        tradingSince: FIXTURE_DATE,
        profileImage: "",
        walletAddress: null,
        verificationLevel: "simulated",
        creditScore: null,
        preferredCurrency: "USD",
        address: null,
        phone: null,
        identityCommitment: null,
        zkpIdentity: null,
        zkpVerified: false,
      },
      {
        username: "fixture_freight",
        password: "!",
        fullName: "Adriatic Freight Fixture",
        email: "fixture-freight@example.invalid",
        role: "broker",
        kycStatus: "fixture",
        accountLevel: "prototype",
        tradingSince: FIXTURE_DATE,
        profileImage: "",
        walletAddress: null,
        verificationLevel: "simulated",
        creditScore: null,
        preferredCurrency: "USD",
        address: null,
        phone: null,
        identityCommitment: null,
        zkpIdentity: null,
        zkpVerified: false,
      },
    ];

    for (const fixtureUser of fixtureUsers) {
      const id = this.userIdCounter++;
      this.usersMap.set(id, { id, ...fixtureUser });
    }

    const fixtureCommodities: InsertCommodity[] = [
      {
        name: "Copper Cathodes",
        grade: "LME Grade A",
        price: 8_420,
        priceUnit: "metric t",
        volume: 18,
        volumeUnit: "metric t",
        ownerId: 2,
        description: "Synthetic protocol fixture; not an active listing.",
        category: "metals",
        subcategory: "copper",
        origin: "Antofagasta, CL",
        certifications: [],
        marketTrend: "fixture",
        status: "available",
        icon: "shapes",
        iconBg: "red",
      },
      {
        name: "Green Coffee",
        grade: "Excelso EP",
        price: 2_630,
        priceUnit: "metric t",
        volume: 57.6,
        volumeUnit: "metric t",
        ownerId: 1,
        description: "Synthetic protocol fixture; not an active listing.",
        category: "agricultural",
        subcategory: "coffee",
        origin: "Huila, CO",
        certifications: [],
        marketTrend: "fixture",
        status: "available",
        icon: "coffee",
        iconBg: "green",
      },
      {
        name: "Break-bulk Freight",
        grade: "Covered hold",
        price: 148_000,
        priceUnit: "voyage",
        volume: 1,
        volumeUnit: "voyage",
        ownerId: 3,
        description: "Synthetic protocol fixture; not bookable capacity.",
        category: "logistics",
        subcategory: "freight",
        origin: "Adriatic service",
        certifications: [],
        marketTrend: "fixture",
        status: "available",
        icon: "local_shipping",
        iconBg: "amber",
      },
    ];

    for (const insertCommodity of fixtureCommodities) {
      const id = this.commodityIdCounter++;
      this.commoditiesMap.set(id, this.toCommodity(id, insertCommodity));
    }

    const offer = this.toBarterOffer(this.barterIdCounter++, {
      title: "Copper / coffee protocol fixture",
      offeringCommodityId: 1,
      requestingCommodityId: 2,
      offeringUserId: 2,
      requestingUserId: 1,
      valueMatch: 99,
      offererId: 2,
      offeredCommodityId: 1,
      desiredCommodityId: 2,
      offerVolume: 18,
      desiredVolume: 57.6,
      expirationDate: new Date("2025-04-24T09:00:00.000Z"),
      barterRatio: 3.2,
      matchScore: 99,
      status: "pending",
    });
    this.barterOffersMap.set(offer.id, offer);
  }

  private toCommodity(id: number, input: InsertCommodity): Commodity {
    return {
      id,
      name: input.name,
      grade: input.grade,
      price: input.price,
      priceUnit: input.priceUnit,
      volume: input.volume,
      volumeUnit: input.volumeUnit,
      ownerId: input.ownerId,
      description: nullable(input.description),
      category: nullable(input.category),
      subcategory: nullable(input.subcategory),
      origin: nullable(input.origin),
      imageUrl: nullable(input.imageUrl),
      certifications: input.certifications ? [...input.certifications] : [],
      marketTrend: nullable(input.marketTrend),
      contractAddress: nullable(input.contractAddress),
      status: input.status ?? "available",
      createdAt: FIXTURE_DATE,
      icon: input.icon ?? "inventory_2",
      iconBg: input.iconBg ?? "primary",
    };
  }

  private toBarterOffer(id: number, input: InsertBarterOffer): BarterOffer {
    return {
      id,
      title: input.title,
      offeringCommodityId: input.offeringCommodityId,
      requestingCommodityId: input.requestingCommodityId,
      offeringUserId: input.offeringUserId,
      requestingUserId: input.requestingUserId,
      valueMatch: input.valueMatch,
      offererId: nullable(input.offererId),
      offeredCommodityId: nullable(input.offeredCommodityId),
      desiredCommodityId: nullable(input.desiredCommodityId),
      offerVolume: nullable(input.offerVolume),
      desiredVolume: nullable(input.desiredVolume),
      expirationDate: nullable(input.expirationDate),
      barterRatio: nullable(input.barterRatio),
      matchScore: nullable(input.matchScore),
      status: input.status ?? "pending",
      createdAt: FIXTURE_DATE,
    };
  }

  async getUser(id: number) { return this.usersMap.get(id); }
  async getUserByUsername(username: string) {
    return [...this.usersMap.values()].find((user) => user.username === username);
  }
  async getUserByEmail(email: string) {
    return [...this.usersMap.values()].find((user) => user.email === email);
  }
  async searchUsers(searchTerm: string, limit?: number) {
    const needle = searchTerm.toLowerCase();
    const users = [...this.usersMap.values()].filter((user) =>
      [user.username, user.fullName, user.email].some((value) =>
        value.toLowerCase().includes(needle),
      ),
    );
    return limit ? users.slice(0, limit) : users;
  }
  async createUser(input: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = {
      id,
      username: input.username,
      password: input.password,
      fullName: input.fullName,
      email: input.email,
      role: "trader",
      kycStatus: "pending",
      accountLevel: "standard",
      tradingSince: new Date(),
      profileImage: input.profileImage ?? "",
      walletAddress: null,
      verificationLevel: null,
      creditScore: null,
      preferredCurrency: "USD",
      address: null,
      phone: null,
      identityCommitment: null,
      zkpIdentity: null,
      zkpVerified: false,
    };
    this.usersMap.set(id, user);
    return user;
  }
  async updateUser(id: number, data: Partial<User>) {
    const current = this.usersMap.get(id);
    if (!current) return undefined;
    const updated = { ...current, ...data };
    this.usersMap.set(id, updated);
    return updated;
  }

  async getCommodity(id: number) { return this.commoditiesMap.get(id); }
  async getCommodities(limit?: number) {
    const values = [...this.commoditiesMap.values()];
    return limit ? values.slice(0, limit) : values;
  }
  async getCommoditiesByOwner(ownerId: number) {
    return [...this.commoditiesMap.values()].filter((item) => item.ownerId === ownerId);
  }
  async searchCommodities(searchTerm: string, limit?: number) {
    const needle = searchTerm.toLowerCase();
    const values = [...this.commoditiesMap.values()].filter((item) =>
      [item.name, item.grade, item.status, item.category ?? ""].some((value) =>
        value.toLowerCase().includes(needle),
      ),
    );
    return limit ? values.slice(0, limit) : values;
  }
  async createCommodity(input: InsertCommodity) {
    const item = this.toCommodity(this.commodityIdCounter++, input);
    this.commoditiesMap.set(item.id, item);
    return item;
  }
  async updateCommodity(id: number, data: Partial<Commodity>) {
    const current = this.commoditiesMap.get(id);
    if (!current) return undefined;
    const updated = { ...current, ...data };
    this.commoditiesMap.set(id, updated);
    return updated;
  }
  async deleteCommodity(id: number) { return this.commoditiesMap.delete(id); }

  async getBarterOffer(id: number) { return this.barterOffersMap.get(id); }
  async getBarterOffersByUser(userId: number) {
    return [...this.barterOffersMap.values()].filter(
      (offer) => offer.offeringUserId === userId || offer.requestingUserId === userId,
    );
  }
  async createBarterOffer(input: InsertBarterOffer) {
    const offer = this.toBarterOffer(this.barterIdCounter++, input);
    this.barterOffersMap.set(offer.id, offer);
    return offer;
  }
  async updateBarterOffer(id: number, data: Partial<BarterOffer>) {
    const current = this.barterOffersMap.get(id);
    if (!current) return undefined;
    const updated = { ...current, ...data };
    this.barterOffersMap.set(id, updated);
    return updated;
  }
  async deleteBarterOffer(id: number) { return this.barterOffersMap.delete(id); }

  async getContract(id: number) { return this.contractsMap.get(id); }
  async getContractsByUser(userId: number) {
    return [...this.contractsMap.values()].filter(
      (contract) => contract.sellerId === userId || contract.buyerId === userId,
    );
  }
  async createContract(input: InsertContract): Promise<Contract> {
    const id = this.contractIdCounter++;
    const now = new Date();
    const contract: Contract = {
      id,
      contractNumber: `SIM-${String(id).padStart(4, "0")}`,
      title: input.title,
      sellerId: input.sellerId,
      buyerId: input.buyerId,
      commodityId: input.commodityId,
      quantity: input.quantity,
      price: input.price,
      terms: input.terms,
      amount: nullable(input.amount),
      contractType: nullable(input.contractType),
      paymentTerms: nullable(input.paymentTerms),
      deliveryDate: nullable(input.deliveryDate),
      smartContractAddress: null,
      deliveryMethod: nullable(input.deliveryMethod),
      termsHash: nullable(input.termsHash),
      documents: input.documents ? [...input.documents] : [],
      status: input.status ?? "pending",
      createdAt: now,
      updatedAt: now,
    };
    this.contractsMap.set(id, contract);
    return contract;
  }
  async updateContract(id: number, data: Partial<Contract>) {
    const current = this.contractsMap.get(id);
    if (!current) return undefined;
    const updated = { ...current, ...data, updatedAt: new Date() };
    this.contractsMap.set(id, updated);
    return updated;
  }

  async getTransaction(id: number) { return this.transactionsMap.get(id); }
  async getTransactionsByUser(userId: number) {
    return [...this.transactionsMap.values()].filter(
      (transaction) => transaction.senderId === userId || transaction.receiverId === userId,
    );
  }
  async createTransaction(input: InsertTransaction): Promise<Transaction> {
    const id = this.transactionIdCounter++;
    const transaction: Transaction = {
      id,
      type: input.type,
      senderId: input.senderId,
      receiverId: input.receiverId,
      commodityId: nullable(input.commodityId),
      barterId: nullable(input.barterId),
      contractId: nullable(input.contractId),
      amount: nullable(input.amount),
      status: input.status,
      createdAt: new Date(),
      metadata: nullable(input.metadata),
    };
    this.transactionsMap.set(id, transaction);
    return transaction;
  }

  async getNotification(id: number) { return this.notificationsMap.get(id); }
  async getNotificationsByUser(userId: number) {
    return [...this.notificationsMap.values()]
      .filter((notification) => notification.userId === userId)
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
  }
  async createNotification(input: InsertNotification): Promise<Notification> {
    const id = this.notificationIdCounter++;
    const notification: Notification = {
      id,
      userId: input.userId,
      title: input.title ?? "Protocol notice",
      message: input.message,
      type: input.type,
      read: input.read ?? false,
      icon: input.icon ?? "notifications",
      iconBg: input.iconBg ?? "info",
      createdAt: new Date(),
    };
    this.notificationsMap.set(id, notification);
    return notification;
  }
  async markNotificationAsRead(id: number) {
    const current = this.notificationsMap.get(id);
    if (!current) return false;
    this.notificationsMap.set(id, { ...current, read: true });
    return true;
  }

  async getKycDocument(id: number) { return this.kycDocumentsMap.get(id); }
  async getKycDocumentsByUser(userId: number) {
    return [...this.kycDocumentsMap.values()].filter((item) => item.userId === userId);
  }
  async createKycDocument(input: InsertKycDocument): Promise<KycDocument> {
    const id = this.kycDocumentIdCounter++;
    const document: KycDocument = {
      id,
      userId: input.userId,
      documentType: input.documentType,
      documentNumber: input.documentNumber,
      verified: input.verified ?? false,
      status: input.status ?? "pending",
      fileUrl: nullable(input.fileUrl),
      verifiedAt: nullable(input.verifiedAt),
      verifiedBy: nullable(input.verifiedBy),
      uploadedAt: new Date(),
      zkpVerified: input.zkpVerified ?? false,
      verificationProofId: nullable(input.verificationProofId),
      identityCommitment: nullable(input.identityCommitment),
    };
    this.kycDocumentsMap.set(id, document);
    return document;
  }
  async verifyKycDocument(id: number) {
    const current = this.kycDocumentsMap.get(id);
    if (!current) return undefined;
    const updated: KycDocument = {
      ...current,
      verified: true,
      status: "verified",
      verifiedAt: new Date(),
      verifiedBy: "prototype-admin",
    };
    this.kycDocumentsMap.set(id, updated);
    return updated;
  }
}

export const storage: IStorage = process.env.DATABASE_URL
  ? (await import("./db-storage")).storage
  : new MemStorage();
