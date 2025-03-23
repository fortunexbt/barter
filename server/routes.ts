import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  insertCommoditySchema, 
  insertBarterOfferSchema, 
  insertContractSchema, 
  insertTransactionSchema, 
  insertNotificationSchema, 
  insertKycDocumentSchema,
  InsertCommodity,
  InsertBarterOffer,
  InsertContract,
  InsertTransaction,
  InsertNotification,
  InsertKycDocument
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { WebSocketServer } from 'ws';
import { ZKPService } from './services/zkp-service';

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
  
  // Store active connections by user ID
  const clients = new Map();
  
  // Handle WebSocket connections
  wss.on('connection', (ws, req) => {
    console.log('WebSocket client connected to notifications channel');
    
    // Send a welcome message to confirm connection
    ws.send(JSON.stringify({
      type: 'system',
      message: 'Connected to notification system'
    }));
    
    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);
        if (data.type === 'auth' && data.userId) {
          // Store the connection with the user ID
          clients.set(data.userId, ws);
          console.log(`User ${data.userId} authenticated with WebSocket`);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    ws.on('close', () => {
      // Remove connection when closed
      for (const [userId, client] of clients.entries()) {
        if (client === ws) {
          clients.delete(userId);
          console.log(`User ${userId} WebSocket connection closed`);
          break;
        }
      }
    });
    
    // Handle errors
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });
  
  // Helper function to send notification via WebSocket
  const sendNotification = (userId: number, notification: any) => {
    const client = clients.get(userId);
    if (client && client.readyState === 1) { // WebSocket.OPEN
      client.send(JSON.stringify(notification));
    }
  };

  // Middleware to verify authentication
  const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: 'Unauthorized' });
  };
  
  // Middleware for validating request body with Zod schema
  const validateBody = (schema) => (req, res, next) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        next(error);
      }
    }
  };

  // Commodity routes
  app.get('/api/commodities', async (req, res, next) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const commodities = await storage.getCommodities(limit);
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
      res.json(commodity);
    } catch (error) {
      next(error);
    }
  });
  
  app.post('/api/commodities', isAuthenticated, validateBody(insertCommoditySchema), async (req, res, next) => {
    try {
      const commodityData: InsertCommodity = {
        ...req.body,
        ownerId: req.user!.id,
      };
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
  
  // Barter routes
  app.get('/api/barter', isAuthenticated, async (req, res, next) => {
    try {
      const barterOffers = await storage.getBarterOffersByUser(req.user!.id);
      res.json(barterOffers);
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
  
  // KYC routes
  
  // Generate ZKP identity for KYC verification
  app.post('/api/kyc/generate-identity', isAuthenticated, async (req, res, next) => {
    try {
      // Initialize ZKP group if not already done
      ZKPService.initialize();
      
      // Create a new identity for the user
      const { identity, identityCommitment, serializedIdentity } = ZKPService.createIdentity();
      
      // Add the identity commitment to the group
      ZKPService.addMember(identityCommitment);
      
      // Update the user's record with the serialized identity
      const updatedUser = await storage.updateUser(req.user!.id, {
        zkpIdentity: serializedIdentity
      });
      
      // Return the updated user data
      res.json(updatedUser);
    } catch (error) {
      console.error('Error generating ZKP identity:', error);
      next(error);
    }
  });

  app.post('/api/kyc/documents', isAuthenticated, validateBody(insertKycDocumentSchema), async (req, res, next) => {
    try {
      const kycDocumentData: InsertKycDocument = {
        ...req.body,
        userId: req.user!.id,
      };
      const kycDocument = await storage.createKycDocument(kycDocumentData);
      res.status(201).json(kycDocument);
    } catch (error) {
      next(error);
    }
  });
  
  app.get('/api/kyc/documents', isAuthenticated, async (req, res, next) => {
    try {
      const kycDocuments = await storage.getKycDocumentsByUser(req.user!.id);
      res.json(kycDocuments);
    } catch (error) {
      next(error);
    }
  });
  
  // For demo purposes, auto-verify KYC documents. In a real app, this would be an admin-only route
  app.put('/api/kyc/documents/:id/verify', isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const kycDocument = await storage.getKycDocument(id);
      
      if (!kycDocument) {
        return res.status(404).json({ message: 'KYC document not found' });
      }
      
      // In a real app, this would check for admin permissions
      
      const verifiedDocument = await storage.verifyKycDocument(id);
      
      // Create notification for the user
      const notification: InsertNotification = {
        userId: kycDocument.userId,
        message: `Your ${kycDocument.documentType} has been verified`,
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

  return httpServer;
}
