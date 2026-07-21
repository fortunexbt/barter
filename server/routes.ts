import type { Express, NextFunction, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  insertCommoditySchema, 
  insertBarterOfferSchema, 
  insertContractSchema, 
  insertTransactionSchema, 
  insertNotificationSchema, 
  InsertCommodity,
  InsertBarterOffer,
  InsertContract,
  InsertTransaction,
  InsertNotification,
  InsertKycDocument
} from "@shared/schema";
import { ZodError, type ZodType } from "zod";
import { fromZodError } from "zod-validation-error";
import { WebSocketServer } from 'ws';
import { ZKPService } from './services/zkp-service';
import { SmartContractService } from './services/smart-contract-service';

const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.user!.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden - Admin access required' });
  }

  return next();
};

const toPublicUser = <T extends { password: string; zkpIdentity: unknown }>(
  user: T,
): Omit<T, 'password' | 'zkpIdentity'> => {
  const { password: _password, zkpIdentity: _zkpIdentity, ...publicUser } = user;
  return publicUser;
};

const IDENTITY_FIXTURE_IDS = new Set([
  "IDF-0174-ALPHA",
  "IDF-0288-BRAVO",
  "IDF-0312-CHARLIE",
]);

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup auth routes (/api/register, /api/login, /api/logout, /api/user)
  setupAuth(app);
  
  // Add health check endpoint
  app.get('/api/health', (req, res) => {
    res.status(200).json({ 
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date()
    });
  });

  // Create HTTP server
  const httpServer = createServer(app);
  
  // Setup WebSocket for real-time notifications with explicit port
  // Using a separate path to avoid conflicts with Vite HMR
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/api/ws/notifications'
  });
  
  // The original prototype trusted a client-supplied user ID, which allowed
  // notification impersonation. Keep the endpoint explicit and closed until
  // the HTTP session can be authenticated during the WebSocket upgrade.
  wss.on('connection', (ws) => {
    ws.send(JSON.stringify({
      type: 'system',
      message: 'Live notifications are disabled in this prototype; use REST refreshes.'
    }));
    ws.close(1008, 'Session-authenticated WebSockets are not implemented');
  });

  const sendNotification = (_userId: number, _notification: unknown) => undefined;

  // Middleware to verify authentication
  const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: 'Unauthorized' });
  };
  
  // Middleware for validating request body with Zod schema
  const validateBody = (schema: ZodType) => (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        console.log('Validation error details:', error.format());
        res.status(400).json({ message: validationError.message, details: error.format() });
      } else {
        next(error);
      }
    }
  };

  // Commodity routes
  app.get('/api/commodities', async (req, res, next) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const owner = req.query.owner ? req.query.owner === 'true' : false;
      const commodities = await storage.getCommodities(limit);
      
      // If owner details are requested, enhance commodities with owner information
      if (owner) {
        const enhancedCommodities = await Promise.all(
          commodities.map(async (commodity) => {
            const owner = await storage.getUser(commodity.ownerId);
            return {
              ...commodity,
              owner: owner ? {
                id: owner.id,
                username: owner.username,
                fullName: owner.fullName || owner.username,
                avatarUrl: owner.profileImage,
                verificationStatus: owner.kycStatus
              } : null
            };
          })
        );
        return res.json(enhancedCommodities);
      }
      
      res.json(commodities);
    } catch (error) {
      next(error);
    }
  });
  
  app.get('/api/commodities/:id', async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const commodity = await storage.getCommodity(id);
      
      if (!commodity) {
        return res.status(404).json({ message: 'Commodity not found' });
      }
      
      // Always include owner details for single commodity view
      const owner = await storage.getUser(commodity.ownerId);
      const enhancedCommodity = {
        ...commodity,
        owner: owner ? {
          id: owner.id,
          username: owner.username,
          fullName: owner.fullName || owner.username,
          avatarUrl: owner.profileImage,
          verificationStatus: owner.kycStatus
        } : null
      };
      
      res.json(enhancedCommodity);
    } catch (error) {
      next(error);
    }
  });
  
  // Use a modified schema that omits ownerId for validation since we'll add it after validation
  const clientCommoditySchema = insertCommoditySchema.omit({ ownerId: true });
  
  app.post('/api/commodities', isAuthenticated, validateBody(clientCommoditySchema), async (req, res, next) => {
    try {
      // Add ownerId from the authenticated user
      const commodityData: InsertCommodity = {
        ...req.body,
        ownerId: req.user!.id,
      };
      
      // Create the commodity in storage
      const commodity = await storage.createCommodity(commodityData);
      res.status(201).json(commodity);
    } catch (error) {
      next(error);
    }
  });
  
  app.put('/api/commodities/:id', isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const commodity = await storage.getCommodity(id);
      
      if (!commodity) {
        return res.status(404).json({ message: 'Commodity not found' });
      }
      
      if (commodity.ownerId !== req.user!.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      const updatedCommodity = await storage.updateCommodity(id, req.body);
      res.json(updatedCommodity);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete('/api/commodities/:id', isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const commodity = await storage.getCommodity(id);
      
      if (!commodity) {
        return res.status(404).json({ message: 'Commodity not found' });
      }
      
      if (commodity.ownerId !== req.user!.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      await storage.deleteCommodity(id);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });
  
  // Commodity search route
  app.get('/api/commodities/search', async (req, res, next) => {
    try {
      const searchTerm = req.query.q as string || '';
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      if (!searchTerm.trim()) {
        return res.json([]);
      }
      
      const results = await storage.searchCommodities(searchTerm, limit);
      
      // Include owner details in search results
      const enhancedResults = await Promise.all(
        results.map(async (commodity) => {
          const owner = await storage.getUser(commodity.ownerId);
          return {
            ...commodity,
            owner: owner ? {
              id: owner.id,
              username: owner.username,
              fullName: owner.fullName || owner.username,
              avatarUrl: owner.profileImage,
              verificationStatus: owner.kycStatus
            } : null
          };
        })
      );
      
      res.json(enhancedResults);
    } catch (error) {
      next(error);
    }
  });
  
  // Barter routes
  app.get('/api/barter', isAuthenticated, async (req, res, next) => {
    try {
      const barterOffers = await storage.getBarterOffersByUser(req.user!.id);
      res.json(barterOffers);
    } catch (error) {
      next(error);
    }
  });
  
  // Get single barter offer with details
  app.get('/api/barter/:id', isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const barterOffer = await storage.getBarterOffer(id);
      
      if (!barterOffer) {
        return res.status(404).json({ message: 'Barter offer not found' });
      }
      
      // Check if user is authorized to view this barter offer
      if (barterOffer.offeringUserId !== req.user!.id && barterOffer.requestingUserId !== req.user!.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      // Get additional details for the barter offer
      const offeringCommodity = await storage.getCommodity(barterOffer.offeringCommodityId);
      const requestingCommodity = await storage.getCommodity(barterOffer.requestingCommodityId);
      const offeringUser = await storage.getUser(barterOffer.offeringUserId);
      const requestingUser = await storage.getUser(barterOffer.requestingUserId);
      
      // Create enhanced barter offer with all details
      const enhancedBarterOffer = {
        ...barterOffer,
        offeringCommodity: offeringCommodity || null,
        requestingCommodity: requestingCommodity || null,
        offeringUser: offeringUser ? {
          id: offeringUser.id,
          username: offeringUser.username,
          fullName: offeringUser.fullName || offeringUser.username,
          avatarUrl: offeringUser.profileImage,
          verificationStatus: offeringUser.kycStatus
        } : null,
        requestingUser: requestingUser ? {
          id: requestingUser.id,
          username: requestingUser.username,
          fullName: requestingUser.fullName || requestingUser.username,
          avatarUrl: requestingUser.profileImage,
          verificationStatus: requestingUser.kycStatus
        } : null
      };
      
      res.json(enhancedBarterOffer);
    } catch (error) {
      next(error);
    }
  });
  
  app.post('/api/barter', isAuthenticated, validateBody(insertBarterOfferSchema), async (req, res, next) => {
    try {
      const barterData: InsertBarterOffer = {
        ...req.body,
        offeringUserId: req.user!.id,
      };
      const barterOffer = await storage.createBarterOffer(barterData);
      
      // Create notification for the receiving user
      const notification: InsertNotification = {
        userId: barterData.requestingUserId,
        message: `You have received a new barter offer`,
        type: 'barter',
        icon: 'swap_horiz',
        iconBg: 'warning',
        read: false,
      };
      const createdNotification = await storage.createNotification(notification);
      
      // Send real-time notification
      sendNotification(barterData.requestingUserId, {
        type: 'notification',
        data: createdNotification,
      });
      
      res.status(201).json(barterOffer);
    } catch (error) {
      next(error);
    }
  });
  
  app.put('/api/barter/:id', isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const barterOffer = await storage.getBarterOffer(id);
      
      if (!barterOffer) {
        return res.status(404).json({ message: 'Barter offer not found' });
      }
      
      if (barterOffer.requestingUserId !== req.user!.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      const updatedBarterOffer = await storage.updateBarterOffer(id, {
        status: req.body.status,
      });
      
      // Create notification for the offering user
      const notification: InsertNotification = {
        userId: barterOffer.offeringUserId,
        message: `Your barter offer has been ${req.body.status}`,
        type: 'barter',
        icon: 'swap_horiz',
        iconBg: req.body.status === 'accepted' ? 'success' : 'error',
        read: false,
      };
      const createdNotification = await storage.createNotification(notification);
      
      // Send real-time notification
      sendNotification(barterOffer.offeringUserId, {
        type: 'notification',
        data: createdNotification,
      });
      
      res.json(updatedBarterOffer);
    } catch (error) {
      next(error);
    }
  });
  
  // Contract routes
  app.get('/api/contracts', isAuthenticated, async (req, res, next) => {
    try {
      const contracts = await storage.getContractsByUser(req.user!.id);
      res.json(contracts);
    } catch (error) {
      next(error);
    }
  });
  
  app.post('/api/contracts', isAuthenticated, validateBody(insertContractSchema), async (req, res, next) => {
    try {
      const contractData: InsertContract = {
        ...req.body,
        sellerId: req.user!.id,
      };
      const contract = await storage.createContract(contractData);
      
      // Create notification for the buyer
      const notification: InsertNotification = {
        userId: contractData.buyerId,
        message: `New contract #${contract.contractNumber} requires your signature`,
        type: 'contract',
        icon: 'description',
        iconBg: 'info',
        read: false,
      };
      const createdNotification = await storage.createNotification(notification);
      
      // Send real-time notification
      sendNotification(contractData.buyerId, {
        type: 'notification',
        data: createdNotification,
      });
      
      res.status(201).json(contract);
    } catch (error) {
      next(error);
    }
  });
  
  app.put('/api/contracts/:id', isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const contract = await storage.getContract(id);
      
      if (!contract) {
        return res.status(404).json({ message: 'Contract not found' });
      }
      
      // Only buyer can update contract status (to sign it)
      if (contract.buyerId !== req.user!.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      const updatedContract = await storage.updateContract(id, {
        status: req.body.status,
      });
      
      // Create notification for the seller
      const notification: InsertNotification = {
        userId: contract.sellerId,
        message: `Contract #${contract.contractNumber} has been ${req.body.status} by the buyer`,
        type: 'contract',
        icon: 'description',
        iconBg: req.body.status === 'signed' ? 'success' : 'error',
        read: false,
      };
      const createdNotification = await storage.createNotification(notification);
      
      // Send real-time notification
      sendNotification(contract.sellerId, {
        type: 'notification',
        data: createdNotification,
      });
      
      res.json(updatedContract);
    } catch (error) {
      next(error);
    }
  });
  
  // Transaction routes
  app.get('/api/transactions', isAuthenticated, async (req, res, next) => {
    try {
      const transactions = await storage.getTransactionsByUser(req.user!.id);
      res.json(transactions);
    } catch (error) {
      next(error);
    }
  });
  
  // Smart contract routes integrated with the SmartContractService
  
  app.post('/api/transactions', isAuthenticated, validateBody(insertTransactionSchema), async (req, res, next) => {
    try {
      const transactionData: InsertTransaction = {
        ...req.body,
        senderId: req.user!.id,
      };
      const transaction = await storage.createTransaction(transactionData);
      
      // Create notification for the receiver
      const notification: InsertNotification = {
        userId: transactionData.receiverId,
        message: `New ${transactionData.type} transaction has been initiated`,
        type: 'transaction',
        icon: 'paid',
        iconBg: 'accent',
        read: false,
      };
      const createdNotification = await storage.createNotification(notification);
      
      // Send real-time notification
      sendNotification(transactionData.receiverId, {
        type: 'notification',
        data: createdNotification,
      });
      
      res.status(201).json(transaction);
    } catch (error) {
      next(error);
    }
  });
  
  // Notification routes
  app.get('/api/notifications', isAuthenticated, async (req, res, next) => {
    try {
      const notifications = await storage.getNotificationsByUser(req.user!.id);
      res.json(notifications);
    } catch (error) {
      next(error);
    }
  });
  
  app.put('/api/notifications/:id/read', isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const notification = await storage.getNotification(id);
      
      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }
      
      if (notification.userId !== req.user!.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      await storage.markNotificationAsRead(id);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });
  
  // User routes
  
  // Get user by ID (public info only)
  app.get('/api/user/:id', async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Remove sensitive information
      const publicUser = {
        id: user.id,
        fullName: user.fullName,
        role: user.role,
        kycStatus: user.kycStatus,
        accountLevel: user.accountLevel,
        tradingSince: user.tradingSince,
        profileImage: user.profileImage,
        zkpVerified: user.zkpVerified
      };
      
      res.json(publicUser);
    } catch (error) {
      next(error);
    }
  });
  
  // User search route
  app.get('/api/users/search', async (req, res, next) => {
    try {
      const searchTerm = req.query.q as string || '';
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      if (!searchTerm.trim()) {
        return res.json([]);
      }
      
      const results = await storage.searchUsers(searchTerm, limit);
      
      // Return only public user information
      const publicUsers = results.map(user => ({
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        kycStatus: user.kycStatus,
        accountLevel: user.accountLevel,
        tradingSince: user.tradingSince,
        profileImage: user.profileImage,
        // Use profileImage as avatarUrl for compatibility with UI components
        avatarUrl: user.profileImage,
        verificationStatus: user.kycStatus,
        zkpVerified: user.zkpVerified
      }));
      
      res.json(publicUsers);
    } catch (error) {
      next(error);
    }
  });
  
  // KYC routes

  const createIdentityFixtureRecord = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fixtureId = req.body?.fixtureId;
      if (typeof fixtureId !== "string" || !IDENTITY_FIXTURE_IDS.has(fixtureId)) {
        return res.status(400).json({
          message: "Only named synthetic identity fixture IDs are accepted",
          acceptedFixtureIds: [...IDENTITY_FIXTURE_IDS],
        });
      }

      const kycDocumentData: InsertKycDocument = {
        userId: req.user!.id,
        documentType: "synthetic_fixture",
        documentNumber: fixtureId,
        status: "fixture",
        verified: false,
      };
      const kycDocument = await storage.createKycDocument(kycDocumentData);

      await storage.createNotification({
        userId: req.user!.id,
        message: `Synthetic identity fixture ${fixtureId} loaded; no document was uploaded`,
        type: "kyc",
        icon: "science",
        iconBg: "info",
        read: false,
      });

      res.status(201).json(kycDocument);
    } catch (error) {
      next(error);
    }
  };

  app.post('/api/kyc/documents', isAuthenticated, createIdentityFixtureRecord);
  app.post('/api/kyc/submit', isAuthenticated, createIdentityFixtureRecord);
  
  app.get('/api/kyc/documents', isAuthenticated, async (req, res, next) => {
    try {
      const kycDocuments = await storage.getKycDocumentsByUser(req.user!.id);
      res.json(kycDocuments);
    } catch (error) {
      next(error);
    }
  });
  
  // ZKP identity generation endpoint
  app.post('/api/kyc/generate-identity', isAuthenticated, async (req, res, next) => {
    try {
      // Generate ZKP identity using the ZKP service
      const identityData = ZKPService.createIdentity();
      ZKPService.addMember(identityData.identityCommitment);
      
      // Update the user with the identity commitment
      const updatedUser = await storage.updateUser(req.user!.id, {
        identityCommitment: identityData.identityCommitment,
        zkpIdentity: identityData.serializedIdentity,
      });

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Create a notification
      const notification: InsertNotification = {
        userId: req.user!.id,
        message: "A synthetic challenge-response experiment identity has been generated",
        type: "kyc",
        icon: "shield",
        iconBg: "info",
        read: false,
      };
      
      await storage.createNotification(notification);
      
      res.status(201).json(toPublicUser(updatedUser));
    } catch (error) {
      next(error);
    }
  });
  
  // ZKP verification endpoint
  app.post('/api/kyc/verify-proof', isAuthenticated, async (req, res, next) => {
    try {
      // Get the user's ZKP identity
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }
      
      if (!user.zkpIdentity) {
        return res.status(400).json({ message: "Generate an experiment identity first" });
      }

      const identity = ZKPService.deserializeIdentity(user.zkpIdentity);
      if (!identity) {
        return res.status(400).json({ message: "Stored experiment identity is invalid" });
      }

      const submittedProof = req.body?.proofData;
      const proofData = typeof submittedProof === "string"
        ? submittedProof
        : typeof submittedProof?.proofData === "string"
          ? submittedProof.proofData
          : (await ZKPService.generateVerificationProof(
              identity,
              `prototype-user:${user.id}`,
            )).proofData;

      const isValid = await ZKPService.verifyIdentityProof(proofData);
      if (!isValid) {
        return res.status(400).json({ message: "Experiment proof did not validate" });
      }

      // Proof validity is deliberately separate from real-world identity/KYC status.
      const updatedUser = await storage.updateUser(req.user!.id, {
        zkpVerified: true,
      });

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Create a notification
      const notification: InsertNotification = {
        userId: req.user!.id,
        message: "Your synthetic challenge-response fixture validated; KYC status is unchanged",
        type: "kyc",
        icon: "shield_check",
        iconBg: "success",
        read: false,
      };
      
      await storage.createNotification(notification);
      
      res.json({ success: true, user: toPublicUser(updatedUser), kycVerified: false });
    } catch (error) {
      console.error("ZKP verification error:", error);
      next(error);
    }
  });

  app.put('/api/kyc/documents/:id/verify', isAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const kycDocument = await storage.getKycDocument(id);
      
      if (!kycDocument) {
        return res.status(404).json({ message: 'KYC document not found' });
      }
      
      const verifiedDocument = await storage.verifyKycDocument(id);
      
      // Create notification for the user
      const notification: InsertNotification = {
        userId: kycDocument.userId,
        message: `Your ${kycDocument.documentType} prototype record was marked reviewed by an administrator`,
        type: 'kyc',
        icon: 'verified_user',
        iconBg: 'success',
        read: false,
      };
      const createdNotification = await storage.createNotification(notification);
      
      // Send real-time notification
      sendNotification(kycDocument.userId, {
        type: 'notification',
        data: createdNotification,
      });
      
      res.json(verifiedDocument);
    } catch (error) {
      next(error);
    }
  });

  // Smart Contract Routes
  
  // Create an escrow smart contract
  app.post('/api/smart-contracts/escrow', isAuthenticated, async (req, res, next) => {
    try {
      const { buyerId, commodityId, amount, barterId } = req.body;
      
      if (!buyerId || !commodityId || !amount) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      
      // The authenticated user is the seller
      const sellerId = req.user!.id;
      
      // Create escrow contract - include barterId if provided to link contract with barter
      const result = await SmartContractService.createEscrow(
        buyerId,
        sellerId,
        commodityId,
        amount,
        barterId || null
      );
      
      // Create notification for the buyer
      const notification: InsertNotification = {
        userId: buyerId,
        message: `New escrow contract created for your commodity purchase`,
        type: 'smart_contract',
        icon: 'shield',
        iconBg: 'info',
        read: false,
      };
      const createdNotification = await storage.createNotification(notification);
      
      // Send real-time notification
      sendNotification(buyerId, {
        type: 'notification',
        data: createdNotification,
      });
      
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  });
  
  // Deposit funds to escrow
  app.post('/api/smart-contracts/escrow/deposit', isAuthenticated, async (req, res, next) => {
    try {
      const { contractAddress, amount } = req.body;
      
      if (!contractAddress || !amount) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      
      // The authenticated user is the buyer
      const buyerId = req.user!.id;
      
      // Deposit to escrow
      const result = await SmartContractService.depositToEscrow(
        contractAddress,
        buyerId,
        amount
      );
      
      if (result.success) {
        // Find the contract details to get the seller ID
        // In a real app, this would query the blockchain or database
        const transactions = await storage.getTransactionsByUser(buyerId);
        const transaction = transactions.find(t => 
          t.type === 'escrow_creation' && 
          t.senderId === buyerId
        );
        
        if (transaction && transaction.receiverId) {
          // Create notification for the seller
          const notification: InsertNotification = {
            userId: transaction.receiverId,
            message: `Buyer has deposited funds to escrow for your commodity`,
            type: 'smart_contract',
            icon: 'payments',
            iconBg: 'success',
            read: false,
          };
          const createdNotification = await storage.createNotification(notification);
          
          // Send real-time notification
          sendNotification(transaction.receiverId, {
            type: 'notification',
            data: createdNotification,
          });
        }
      }
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  });
  
  // Release funds from escrow
  app.post('/api/smart-contracts/escrow/release', isAuthenticated, async (req, res, next) => {
    try {
      const { contractAddress } = req.body;
      
      if (!contractAddress) {
        return res.status(400).json({ message: 'Missing contract address' });
      }
      
      // The authenticated user is the buyer who confirms delivery
      const buyerId = req.user!.id;
      
      // Find the transaction to get the seller ID
      const transactions = await storage.getTransactionsByUser(buyerId);
      const transaction = transactions.find(t => 
        t.type === 'escrow_creation' && 
        t.senderId === buyerId
      );
      
      if (!transaction || !transaction.receiverId) {
        return res.status(404).json({ message: 'Escrow contract not found' });
      }
      
      // Release funds to seller
      const result = await SmartContractService.releaseFromEscrow(
        contractAddress,
        transaction.receiverId
      );
      
      if (result.success) {
        // Create notification for the seller
        const notification: InsertNotification = {
          userId: transaction.receiverId,
          message: `Buyer has released escrow funds to you`,
          type: 'smart_contract',
          icon: 'task_alt',
          iconBg: 'success',
          read: false,
        };
        const createdNotification = await storage.createNotification(notification);
        
        // Send real-time notification
        sendNotification(transaction.receiverId, {
          type: 'notification',
          data: createdNotification,
        });
        
        // Create a success notification for the buyer as well
        const buyerNotification: InsertNotification = {
          userId: buyerId,
          message: `You have successfully released funds to the seller`,
          type: 'smart_contract',
          icon: 'task_alt',
          iconBg: 'success',
          read: false,
        };
        const createdBuyerNotification = await storage.createNotification(buyerNotification);
        
        // Send real-time notification to buyer
        sendNotification(buyerId, {
          type: 'notification',
          data: createdBuyerNotification,
        });
        
        // If there's a transaction record created, fetch additional information about it
        if (result.transactionId) {
          const transactionRecord = await storage.getTransaction(result.transactionId);
          if (transactionRecord) {
            // Enhance the result with more detailed transaction data
            const enhancedResult = {
              ...result,
              transactionDetails: {
                id: transactionRecord.id,
                type: transactionRecord.type,
                senderId: transactionRecord.senderId,
                receiverId: transactionRecord.receiverId,
                amount: transactionRecord.amount,
                status: transactionRecord.status,
                timestamp: transactionRecord.createdAt
              }
            };
            return res.json(enhancedResult);
          }
        }
      }
      
      // Default response if no enhanced data is available
      res.json(result);
    } catch (error) {
      next(error);
    }
  });
  
  // Verify transaction status
  app.get('/api/smart-contracts/transaction/:hash', isAuthenticated, async (req, res, next) => {
    try {
      const { hash } = req.params;
      
      if (!hash) {
        return res.status(400).json({ message: 'Missing transaction hash' });
      }
      
      const result = await SmartContractService.verifyTransaction(hash);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });
  
  // Get token balances for a user
  app.get('/api/smart-contracts/tokens/:address', isAuthenticated, async (req, res, next) => {
    try {
      const { address } = req.params;
      
      if (!address) {
        return res.status(400).json({ message: 'Missing token address' });
      }
      
      const result = await SmartContractService.getTokenBalance(
        req.user!.id,
        address
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  // Admin routes
  app.get('/api/admin/users', isAdmin, async (req, res, next) => {
    try {
      // In a real app, we might want to get this from a specialized admin data source
      // But for this demo, we'll simply get all users
      const users = await Promise.all(
        (await storage.getCommodities()).map(async c => {
          const owner = await storage.getUser(c.ownerId);
          return owner;
        })
      );
      
      // Filter to unique users
      const uniqueUsers = users.filter((user, index, self) => 
        user && index === self.findIndex(u => u && u.id === user.id)
      );
      
      res.json(uniqueUsers.filter((user): user is NonNullable<typeof user> => Boolean(user)).map(toPublicUser));
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/admin/commodities', isAdmin, async (req, res, next) => {
    try {
      const commodities = await storage.getCommodities();
      
      // Enhance with owner name
      const enhancedCommodities = await Promise.all(
        commodities.map(async (commodity) => {
          const owner = await storage.getUser(commodity.ownerId);
          return {
            ...commodity,
            ownerName: owner ? owner.fullName : 'Unknown'
          };
        })
      );
      
      res.json(enhancedCommodities);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/admin/contracts', isAdmin, async (req, res, next) => {
    try {
      // Get all contracts
      const contracts = await Promise.all(
        (await storage.getCommodities())
          .filter(c => c.status === 'sold')
          .map(async commodity => {
            // Create a simulated contract for this commodity
            const seller = await storage.getUser(commodity.ownerId);
            // Pick a buyer randomly
            const potentialBuyerIds = [1, 2, 3, 4, 5].filter(id => id !== commodity.ownerId);
            const buyerId = potentialBuyerIds[Math.floor(Math.random() * potentialBuyerIds.length)];
            const buyer = await storage.getUser(buyerId);
            
            return {
              id: commodity.id,
              contractNumber: `CNT-${commodity.id}`,
              title: `Contract for ${commodity.name}`,
              sellerId: commodity.ownerId,
              sellerName: seller ? seller.fullName : 'Unknown Seller',
              buyerId: buyerId,
              buyerName: buyer ? buyer.fullName : 'Unknown Buyer',
              commodityId: commodity.id,
              commodityName: commodity.name,
              quantity: commodity.volume,
              price: commodity.price * commodity.volume,
              terms: 'Standard terms of sale',
              status: 'completed',
              createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date in the last 30 days
              updatedAt: new Date()
            };
          })
      );
      
      res.json(contracts);
    } catch (error) {
      next(error);
    }
  });

  return httpServer;
}
