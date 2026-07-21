
# BarterTrade Platform Documentation

> **Archived product concept.** This document preserves the original prototype brief; its blockchain, escrow, identity verification, real-time notification, and marketplace language is aspirational rather than implemented production capability. The root README and `/lab` status sheet are authoritative.

## 1. Project Overview

BarterTrade is a web-based platform designed to facilitate commodity trading and bartering between users. The platform combines traditional trading mechanisms with modern zero-knowledge proof (ZKP) technology for secure identity verification.

### Core Features

- User authentication and profile management
- KYC (Know Your Customer) verification with ZKP
- Commodity listing and management
- Barter offer creation and management
- Smart contract integration for secure trades
- Real-time notifications
- Transaction history and reporting

### Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Shadcn UI components
- **Backend**: Node.js, Express
- **Database**: In-memory storage (can be upgraded to PostgreSQL)
- **Authentication**: Passport.js with session-based auth
- **State Management**: React Context API, React Query
- **Real-time Communication**: WebSockets (ws)
- **Security**: Zero-knowledge proofs for identity verification

## 2. Project Structure

The project is organized as a full-stack JavaScript/TypeScript application with the following structure:

```
├── client/                 # Frontend React application
│   ├── src/                # Source code
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions
│   │   ├── pages/          # Page components
│   │   ├── App.tsx         # Main application component
│   │   └── main.tsx        # Entry point
│   └── index.html          # HTML template
├── server/                 # Backend Express server
│   ├── services/           # Business logic services
│   ├── auth.ts             # Authentication setup
│   ├── index.ts            # Server entry point
│   ├── routes.ts           # API routes
│   ├── storage.ts          # Data storage layer
│   └── vite.ts             # Vite configuration for dev server
├── shared/                 # Shared code between client and server
│   └── schema.ts           # Data models and validation schemas
└── package.json            # Project dependencies and scripts
```

## 3. Architecture

The application follows a client-server architecture with clearly separated concerns:

1. **Client**: React frontend responsible for UI rendering and user interactions
2. **Server**: Express backend handling API requests, business logic, and data storage
3. **Shared**: Common code including data models and validation schemas

### API Structure

The server exposes a RESTful API with the following endpoints:

- `/api/health` - Health check endpoint
- `/api/register` - User registration
- `/api/login` - User authentication
- `/api/logout` - User logout
- `/api/user` - Current user data
- `/api/user/:id` - Public user profile
- `/api/commodities` - Commodity management
- `/api/barter` - Barter offer management
- `/api/contracts` - Contract management
- `/api/transactions` - Transaction management
- `/api/notifications` - Notification management
- `/api/kyc` - KYC document management and verification

WebSocket API for real-time notifications is available at:
- `/api/ws/notifications`

### Authentication Flow

1. User registers via `/api/register` endpoint
2. User logs in via `/api/login` endpoint
3. Server creates a session and returns user data
4. Client stores user data in context and passes session cookie for subsequent requests
5. User can log out via `/api/logout` endpoint

### KYC Verification Flow

1. User submits KYC documents via `/api/kyc/submit` endpoint
2. Admin reviews and verifies documents
3. Zero-knowledge proofs can be generated via `/api/kyc/generate-identity`
4. Verification status is updated in the user profile

## 4. Components and State Management

### Key Frontend Components

- **AppShell**: Main layout wrapper
- **Header**: Navigation and user controls
- **WelcomeModal**: Onboarding modal for new users
- **Forms**: Various form components for user inputs
- **Cards**: Styled card components for displaying items

### State Management

- **Auth Context**: Manages global authentication state
- **React Query**: Handles server state (data fetching, caching, synchronization)
- **Local Storage**: Persists user preferences

## 5. Data Models

### User

```typescript
type User = {
  id: number;
  username: string;
  password: string; // Hashed
  fullName: string;
  email: string;
  role: string; // "trader", "buyer", "broker", "admin"
  kycStatus: string; // "pending", "verified", "rejected"
  accountLevel: string; // "basic", "standard", "premium", "admin"
  tradingSince: Date;
  profileImage: string | null;
  identityCommitment: string | null; // ZKP-related
  zkpIdentity: string | null; // ZKP-related
  zkpVerified: boolean | null; // ZKP verification status
};
```

### Commodity

```typescript
type Commodity = {
  id: number;
  name: string;
  description: string;
  ownerId: number;
  price: number;
  priceUnit: string; // e.g., "lb", "kg", "ton"
  volume: number;
  volumeUnit: string;
  category: string;
  subcategory: string;
  grade: string;
  origin: string;
  imageUrl: string;
  status: string; // "available", "pending", "sold"
  icon: string;
  iconBg: string;
  createdAt: Date;
  certifications?: string[];
  marketTrend?: string;
  contractAddress?: string;
};
```

### Barter Offer

```typescript
type BarterOffer = {
  id: number;
  offererId: number;
  offeredCommodityId: number;
  desiredCommodityId: number;
  offerVolume: number;
  desiredVolume: number;
  status: string; // "active", "completed", "cancelled"
  expirationDate: Date;
  createdAt: Date;
  barterRatio?: number;
  matchScore?: number;
};
```

### Contract

```typescript
type Contract = {
  id: number;
  sellerId: number;
  buyerId: number;
  commodityId: number;
  contractType: string;
  amount: number;
  quantity: number;
  status: string; // "active", "completed", "cancelled"
  paymentTerms: string;
  deliveryDate: Date;
  createdAt: Date;
  updatedAt: Date;
  smartContractAddress?: string;
  deliveryMethod?: string;
  termsHash?: string;
  documents?: string[];
};
```

### Notification

```typescript
type Notification = {
  id: number;
  userId: number;
  type: string; // "system", "kyc", "barter", "contract", "transaction"
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
};
```

### KYC Document

```typescript
type KycDocument = {
  id: number;
  userId: number;
  documentType: string; // "identity_card", "passport", "driver_license"
  documentNumber: string;
  status: string; // "pending", "verified", "rejected"
  fileUrl: string;
  uploadedAt: Date;
  verifiedAt?: Date;
  verifiedBy?: string;
};
```

## 6. Core Features Implementation

### Authentication System

The authentication system is built using Passport.js with a local strategy for username/password authentication. Session management is handled through express-session with a memory store.

Key files:
- `server/auth.ts` - Passport configuration and auth routes
- `client/src/hooks/use-auth.ts` - React hook for auth state
- `client/src/lib/protected-route.tsx` - Route protection component

### Storage System

The storage system uses an in-memory implementation for development purposes, with interfaces that allow for easy replacement with a database implementation.

Key files:
- `server/storage.ts` - Storage interface and in-memory implementation
- `shared/schema.ts` - Data models and validation schemas

### KYC Verification

The KYC verification system allows users to submit identity documents for verification. It includes an innovative zero-knowledge proof implementation for privacy-preserving identity verification.

Key files:
- `server/routes.ts` - KYC API endpoints
- `client/src/components/kyc/kyc-verification-form.tsx` - KYC submission form
- `client/src/components/modals/zkp-verification-modal.tsx` - ZKP verification UI

### Real-time Notifications

The platform implements a WebSocket-based notification system for real-time updates to users.

Key files:
- `server/routes.ts` - WebSocket server setup
- `client/src/components/layout/notification-dropdown.tsx` - Notification UI

### Commodity Management

Users can create, update, and browse commodity listings on the platform.

Key files:
- `server/routes.ts` - Commodity API endpoints
- `client/src/pages/marketplace-page.tsx` - Commodity browsing UI
- `client/src/pages/commodity-detail-page.tsx` - Commodity details UI

### Smart Contract Integration

The platform includes a service layer for interacting with blockchain-based smart contracts.

Key files:
- `server/services/smart-contract-service.ts` - Smart contract interaction logic
- `server/routes.ts` - Smart contract API endpoints

## 7. Development Workflow

### Local Development

To run the application locally:

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm run dev
   ```

This starts both the frontend and backend servers, with the application accessible at port 5000.

### Project Structure Best Practices

- Place all UI components in the `client/src/components` directory
- Group components by feature or type (e.g., `layout`, `forms`, `modals`)
- Use React hooks for reusable logic
- Keep API requests centralized in the appropriate service or hook
- Use the shared schema for consistent data validation

## 8. Future Improvements

### Short-term

- Implement proper database storage (PostgreSQL)
- Add comprehensive error handling and logging
- Enhance the KYC verification process with admin dashboard
- Implement more robust smart contract integrations

### Long-term

- Implement a mobile responsive design
- Add multi-factor authentication
- Develop a mobile app using React Native
- Implement analytics and reporting features
- Add support for multiple languages and currencies

## 9. Troubleshooting

### Common Issues

1. **Authentication issues**
   - Check session configuration in `server/auth.ts`
   - Verify cookie settings and CORS configuration

2. **Real-time notification problems**
   - Check WebSocket connection in browser console
   - Verify client authentication with WebSocket

3. **KYC verification failures**
   - Check file upload permissions
   - Verify ZKP service configuration

### Debugging

- Frontend: Use React DevTools and browser console
- Backend: Check server logs and use debugging endpoints

## 10. Contributing

To contribute to the project:

1. Follow the coding style and conventions
2. Write tests for new features
3. Document your changes
4. Submit pull requests with detailed descriptions
