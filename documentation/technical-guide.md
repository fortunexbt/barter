
# Technical Implementation Guide

> **Archived implementation notes.** Code samples below describe the former prototype design and may not match the revived repository. Current identity screens use a non-zero-knowledge local challenge-response fixture, settlement endpoints simulate state only, and unauthenticated WebSocket identity claims are disabled. See the root README and source for current behavior.

This guide provides a deep dive into the technical implementation of key features in the BarterTrade platform.

## 1. Authentication Implementation

The authentication system is built on Passport.js with session-based authentication:

```typescript
// Server-side authentication setup (server/auth.ts)
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import { storage } from "./storage";

// Setup authentication middleware
export function setupAuth(app: Express) {
  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET is required for persistent deployments");
  }

  // Configure session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
  }));
  
  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Configure LocalStrategy for username/password login
  passport.use(new LocalStrategy(async (username, password, done) => {
    // User authentication logic
  }));
  
  // Session serialization/deserialization
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    // User lookup logic
  });
  
  // Authentication routes (login, register, logout)
}
```

Client-side authentication is managed through React Context:

```typescript
// Client-side auth context (client/src/hooks/use-auth.ts)
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Fetch current user on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/user');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUser();
  }, []);
  
  // Authentication methods (login, register, logout)
  
  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

## 2. Storage System Implementation

The storage system uses an in-memory implementation with interfaces that allow for future database integration:

```typescript
// Storage interface (server/storage.ts)
export interface IStorage {
  // User related methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  // ... other methods
}

// In-memory implementation
export class MemStorage implements IStorage {
  private usersMap: Map<number, User>;
  private commoditiesMap: Map<number, Commodity>;
  // ... other maps
  
  constructor() {
    this.usersMap = new Map();
    this.commoditiesMap = new Map();
    // ... initialize other maps
  }
  
  // Implementation of interface methods
  async getUser(id: number): Promise<User | undefined> {
    return this.usersMap.get(id);
  }
  
  // ... other method implementations
}

// Create singleton instance
export const storage = new MemStorage();
```

## 3. Zero-Knowledge Proof Implementation

The platform uses the Semaphore protocol for zero-knowledge proofs:

```typescript
// ZKP Service (server/services/zkp-service.ts)
import { Group } from "@semaphore-protocol/group";
import { Identity } from "@semaphore-protocol/identity";
import { generateProof, verifyProof } from "@semaphore-protocol/proof";

export class ZKPService {
  private static group: Group;
  
  static initialize() {
    // Initialize a new Semaphore group for ZKP
    this.group = new Group();
  }
  
  static createIdentity() {
    // Create a new Semaphore identity
    const identity = new Identity();
    
    return {
      identity,
      identityCommitment: identity.commitment.toString(),
      serializedIdentity: identity.toString()
    };
  }
  
  static addMember(identityCommitment: string) {
    // Add a member to the Semaphore group
    this.group.addMember(identityCommitment);
  }
  
  static async generateVerificationProof(identity: Identity) {
    // Generate a ZK proof
    const externalNullifier = 1;
    const signal = 1;
    
    const fullProof = await generateProof(
      identity,
      this.group,
      externalNullifier,
      signal
    );
    
    return fullProof;
  }
  
  static async verifyIdentityProof(proof: any) {
    // Verify a ZK proof
    return verifyProof(proof);
  }
}
```

## 4. Real-time Notification System

The platform implements WebSockets for real-time notifications:

```typescript
// WebSocket server setup (server/routes.ts)
import { WebSocketServer } from 'ws';

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Setup WebSocket server
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/api/ws/notifications'
  });
  
  // Store active connections by user ID
  const clients = new Map();
  
  // Handle WebSocket connections
  wss.on('connection', (ws, req) => {
    console.log('WebSocket client connected to notifications channel');
    
    // Client authentication message handling
    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);
        if (data.type === 'auth' && data.userId) {
          // Store the connection with the user ID
          clients.set(data.userId, ws);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    // Connection cleanup
    ws.on('close', () => {
      // Remove connection when closed
      for (const [userId, client] of clients.entries()) {
        if (client === ws) {
          clients.delete(userId);
          break;
        }
      }
    });
  });
  
  // Helper function to send notification via WebSocket
  const sendNotification = (userId: number, notification: any) => {
    const client = clients.get(userId);
    if (client && client.readyState === 1) { // WebSocket.OPEN
      client.send(JSON.stringify(notification));
    }
  };
  
  // Use this function in route handlers to send real-time notifications
  
  return httpServer;
}
```

Client-side WebSocket implementation:

```typescript
// Client WebSocket connection (client/src/hooks/use-notifications.ts)
export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  
  useEffect(() => {
    if (!user) return;
    
    // Create WebSocket connection
    const ws = new WebSocket(`ws://${window.location.host}/api/ws/notifications`);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      // Authenticate with user ID
      ws.send(JSON.stringify({ type: 'auth', userId: user.id }));
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'notification') {
          // Update notifications state
          setNotifications(prevNotifications => 
            [data.data, ...prevNotifications]
          );
        }
      } catch (error) {
        console.error('Error processing notification:', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };
    
    setSocket(ws);
    
    return () => {
      ws.close();
    };
  }, [user]);
  
  // Function to mark notification as read
  const markAsRead = async (id: number) => {
    // Implementation
  };
  
  return { notifications, markAsRead };
}
```

## 5. Smart Contract Integration

The platform includes a service for interacting with blockchain smart contracts:

```typescript
// Smart Contract Service (server/services/smart-contract-service.ts)
export class SmartContractService {
  // In a real implementation, this would connect to a blockchain
  // For demo purposes, we simulate blockchain interactions
  
  static async createEscrow(
    buyerId: number,
    sellerId: number,
    commodityId: number,
    amount: number
  ) {
    // Simulate creating an escrow smart contract
    const contractAddress = `0x${Math.random().toString(16).substring(2, 42)}`;
    
    // In a real implementation, this would deploy a contract to the blockchain
    
    return {
      success: true,
      contractAddress,
      transactionHash: `0x${Math.random().toString(16).substring(2, 66)}`
    };
  }
  
  static async depositToEscrow(
    contractAddress: string,
    buyerId: number,
    amount: number
  ) {
    // Simulate depositing funds to an escrow contract
    
    return {
      success: true,
      transactionHash: `0x${Math.random().toString(16).substring(2, 66)}`
    };
  }
  
  static async releaseFromEscrow(
    contractAddress: string,
    sellerId: number
  ) {
    // Simulate releasing funds from an escrow contract
    
    return {
      success: true,
      transactionHash: `0x${Math.random().toString(16).substring(2, 66)}`
    };
  }
  
  static async verifyTransaction(hash: string) {
    // Simulate verifying a blockchain transaction
    
    return {
      confirmed: true,
      blockNumber: Math.floor(Math.random() * 1000000),
      timestamp: new Date()
    };
  }
  
  static async getTokenBalance(
    userId: number,
    tokenAddress: string
  ) {
    // Simulate getting token balance
    
    return {
      balance: Math.floor(Math.random() * 1000),
      symbol: 'BARTER',
      decimals: 18
    };
  }
}
```

## 6. API Architecture Implementation

The API follows RESTful principles with clear resource-based endpoints:

```typescript
// API routes (server/routes.ts)
export async function registerRoutes(app: Express): Promise<Server> {
  // Setup auth routes
  setupAuth(app);
  
  // Middleware to verify authentication
  const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: 'Unauthorized' });
  };
  
  // Middleware for validating request body
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

  // Resource endpoints
  
  // Commodity routes
  app.get('/api/commodities', async (req, res, next) => {
    // Implementation
  });
  
  app.post('/api/commodities', isAuthenticated, validateBody(insertCommoditySchema), async (req, res, next) => {
    // Implementation
  });
  
  // Similar patterns for other resources:
  // - Barter offers
  // - Contracts
  // - Transactions
  // - Notifications
  // - KYC documents
  
  return httpServer;
}
```

## 7. Frontend Component Architecture

The frontend uses a component-based architecture with React and Tailwind CSS:

### Component Hierarchy

```
App
├── AuthProvider
│   └── QueryClientProvider
│       └── Routes
│           ├── AuthPage (Login/Register)
│           ├── AppShell (Protected routes)
│           │   ├── Header
│           │   │   ├── Navigation
│           │   │   └── NotificationDropdown
│           │   ├── HomePage
│           │   ├── MarketplacePage
│           │   ├── CommodityDetailPage
│           │   ├── BarterPage
│           │   ├── ContractsPage
│           │   ├── TransactionsPage
│           │   └── ProfilePage
│           │       └── KYC Components
│           └── NotFound
└── Toaster (Notifications)
```

### Example Component Pattern

```tsx
// Example UI component with Tailwind CSS (client/src/components/ui/card.tsx)
import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

// Additional card-related components

export { Card, CardHeader, /* other components */ }
```

### Example Page Pattern

```tsx
// Example page component (client/src/pages/marketplace-page.tsx)
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AppShell from "@/components/layout/app-shell";
import { apiRequest } from "@/lib/queryClient";
import { Commodity } from "@shared/schema";
import { CommodityCard } from "@/components/commodity/commodity-card";

export default function MarketplacePage() {
  const [filter, setFilter] = useState({ category: "all" });
  
  // Fetch commodities with React Query
  const { data: commodities, isLoading, error } = useQuery({
    queryKey: ['commodities', filter],
    queryFn: () => apiRequest('/api/commodities')
  });
  
  // Filter handling logic
  
  return (
    <AppShell>
      <div className="container py-6">
        <h1 className="text-3xl font-bold mb-6">Marketplace</h1>
        
        {/* Filter controls */}
        <div className="flex gap-4 mb-6">
          {/* Filter UI */}
        </div>
        
        {/* Commodities grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <p>Loading commodities...</p>
          ) : error ? (
            <p>Error loading commodities</p>
          ) : commodities?.length > 0 ? (
            commodities.map((commodity: Commodity) => (
              <CommodityCard key={commodity.id} commodity={commodity} />
            ))
          ) : (
            <p>No commodities found</p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
```

## 8. Data Flow and State Management

The application uses a combination of global state (Context API) and server state (React Query):

```tsx
// Example of data flow with React Query (client/src/hooks/use-commodities.ts)
export function useCommodities() {
  // Fetch all commodities
  const { 
    data: commodities,
    isLoading,
    error 
  } = useQuery({
    queryKey: ['commodities'],
    queryFn: () => apiRequest('/api/commodities')
  });
  
  // Create a new commodity
  const createCommodity = useMutation({
    mutationFn: (commodityData) => 
      apiRequest('/api/commodities', {
        method: 'POST',
        body: JSON.stringify(commodityData)
      }),
    onSuccess: () => {
      // Invalidate and refetch commodities query
      queryClient.invalidateQueries({ queryKey: ['commodities'] });
      // Show success toast
    }
  });
  
  return {
    commodities,
    isLoading,
    error,
    createCommodity
  };
}
```

## 9. Error Handling Strategy

The application implements a comprehensive error handling strategy:

### API Error Handling

```typescript
// Server-side error handling middleware (server/index.ts)
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({ message });
  throw err;
});
```

### Client-side Error Handling

```typescript
// API request wrapper with error handling (client/src/lib/queryClient.ts)
export async function apiRequest(url: string, options?: RequestInit) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {})
      }
    });
    
    if (!response.ok) {
      // Try to parse error response
      try {
        const errorData = await response.json();
        throw new Error(errorData.message || `API error: ${response.status}`);
      } catch (parseError) {
        throw new Error(`API error: ${response.status}`);
      }
    }
    
    return response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}
```

## 10. Security Considerations

The platform implements several security measures:

### Password Hashing

```typescript
// Password hashing (server/auth.ts)
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}
```

### CSRF Protection

Session-based CSRF protection is provided by the session middleware.

### Input Validation

All API endpoints use Zod schemas for input validation:

```typescript
// Validate request body with Zod (server/routes.ts)
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

// Usage in routes
app.post('/api/commodities', isAuthenticated, validateBody(insertCommoditySchema), async (req, res, next) => {
  // Implementation
});
```

### Authentication Checks

All protected routes verify authentication:

```typescript
// Authentication middleware (server/routes.ts)
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
};

// Usage in routes
app.post('/api/commodities', isAuthenticated, /* other middleware */, async (req, res, next) => {
  // Implementation
});
```

### Resource Authorization

Resource operations check ownership:

```typescript
// Example of ownership check (server/routes.ts)
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
    
    // Proceed with update
  } catch (error) {
    next(error);
  }
});
```
