
# API Reference

> **Archived prototype reference.** Route names are retained for compatibility, but identity, agreement, escrow, settlement, and market operations below are synthetic local state transitions—not live verification, custody, blockchain, or trading services. The WebSocket notification endpoint is intentionally disabled until session-authenticated upgrades exist. See the root README for current capabilities.

This document provides detailed information about the BarterTrade API endpoints.

## Authentication

### Register a new user

- **URL**: `/api/register`
- **Method**: `POST`
- **Auth required**: No
- **Request body**:
  ```json
  {
    "username": "string",
    "password": "string",
    "fullName": "string",
    "email": "string"
  }
  ```
- **Success Response**:
  - **Code**: 201
  - **Content**: `User` object

### Login

- **URL**: `/api/login`
- **Method**: `POST`
- **Auth required**: No
- **Request body**:
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
- **Success Response**:
  - **Code**: 200
  - **Content**: `User` object

### Logout

- **URL**: `/api/logout`
- **Method**: `POST`
- **Auth required**: Yes
- **Success Response**:
  - **Code**: 200
  - **Content**: `{ "message": "Logged out successfully" }`

### Get current user

- **URL**: `/api/user`
- **Method**: `GET`
- **Auth required**: Yes
- **Success Response**:
  - **Code**: 200
  - **Content**: `User` object
- **Error Response**:
  - **Code**: 401
  - **Content**: `{ "message": "Not authenticated" }`

## Users

### Get user by ID

- **URL**: `/api/user/:id`
- **Method**: `GET`
- **Auth required**: No
- **URL Params**: `id=[integer]`
- **Success Response**:
  - **Code**: 200
  - **Content**: Public `User` object
- **Error Response**:
  - **Code**: 404
  - **Content**: `{ "message": "User not found" }`

## Commodities

### Get all commodities

- **URL**: `/api/commodities`
- **Method**: `GET`
- **Auth required**: No
- **Query Params**: `limit=[integer]` (optional)
- **Success Response**:
  - **Code**: 200
  - **Content**: Array of `Commodity` objects

### Get commodity by ID

- **URL**: `/api/commodities/:id`
- **Method**: `GET`
- **Auth required**: No
- **URL Params**: `id=[integer]`
- **Success Response**:
  - **Code**: 200
  - **Content**: `Commodity` object
- **Error Response**:
  - **Code**: 404
  - **Content**: `{ "message": "Commodity not found" }`

### Create commodity

- **URL**: `/api/commodities`
- **Method**: `POST`
- **Auth required**: Yes
- **Request body**: `InsertCommodity` object
- **Success Response**:
  - **Code**: 201
  - **Content**: `Commodity` object

### Update commodity

- **URL**: `/api/commodities/:id`
- **Method**: `PUT`
- **Auth required**: Yes
- **URL Params**: `id=[integer]`
- **Request body**: Partial `Commodity` object
- **Success Response**:
  - **Code**: 200
  - **Content**: Updated `Commodity` object
- **Error Responses**:
  - **Code**: 404 - `{ "message": "Commodity not found" }`
  - **Code**: 403 - `{ "message": "Forbidden" }`

### Delete commodity

- **URL**: `/api/commodities/:id`
- **Method**: `DELETE`
- **Auth required**: Yes
- **URL Params**: `id=[integer]`
- **Success Response**:
  - **Code**: 204
  - **Content**: No content
- **Error Responses**:
  - **Code**: 404 - `{ "message": "Commodity not found" }`
  - **Code**: 403 - `{ "message": "Forbidden" }`

## Barter Offers

### Get user's barter offers

- **URL**: `/api/barter`
- **Method**: `GET`
- **Auth required**: Yes
- **Success Response**:
  - **Code**: 200
  - **Content**: Array of `BarterOffer` objects

### Create barter offer

- **URL**: `/api/barter`
- **Method**: `POST`
- **Auth required**: Yes
- **Request body**: `InsertBarterOffer` object
- **Success Response**:
  - **Code**: 201
  - **Content**: `BarterOffer` object

### Respond to barter offer

- **URL**: `/api/barter/:id`
- **Method**: `PUT`
- **Auth required**: Yes
- **URL Params**: `id=[integer]`
- **Request body**:
  ```json
  {
    "status": "accepted" | "rejected"
  }
  ```
- **Success Response**:
  - **Code**: 200
  - **Content**: Updated `BarterOffer` object
- **Error Responses**:
  - **Code**: 404 - `{ "message": "Barter offer not found" }`
  - **Code**: 403 - `{ "message": "Forbidden" }`

## Contracts

### Get user's contracts

- **URL**: `/api/contracts`
- **Method**: `GET`
- **Auth required**: Yes
- **Success Response**:
  - **Code**: 200
  - **Content**: Array of `Contract` objects

### Create contract

- **URL**: `/api/contracts`
- **Method**: `POST`
- **Auth required**: Yes
- **Request body**: `InsertContract` object
- **Success Response**:
  - **Code**: 201
  - **Content**: `Contract` object

### Update contract status

- **URL**: `/api/contracts/:id`
- **Method**: `PUT`
- **Auth required**: Yes
- **URL Params**: `id=[integer]`
- **Request body**:
  ```json
  {
    "status": "signed" | "completed" | "cancelled"
  }
  ```
- **Success Response**:
  - **Code**: 200
  - **Content**: Updated `Contract` object
- **Error Responses**:
  - **Code**: 404 - `{ "message": "Contract not found" }`
  - **Code**: 403 - `{ "message": "Forbidden" }`

## Transactions

### Get user's transactions

- **URL**: `/api/transactions`
- **Method**: `GET`
- **Auth required**: Yes
- **Success Response**:
  - **Code**: 200
  - **Content**: Array of `Transaction` objects

### Create transaction

- **URL**: `/api/transactions`
- **Method**: `POST`
- **Auth required**: Yes
- **Request body**: `InsertTransaction` object
- **Success Response**:
  - **Code**: 201
  - **Content**: `Transaction` object

## Notifications

### Get user's notifications

- **URL**: `/api/notifications`
- **Method**: `GET`
- **Auth required**: Yes
- **Success Response**:
  - **Code**: 200
  - **Content**: Array of `Notification` objects

### Mark notification as read

- **URL**: `/api/notifications/:id/read`
- **Method**: `PUT`
- **Auth required**: Yes
- **URL Params**: `id=[integer]`
- **Success Response**:
  - **Code**: 204
  - **Content**: No content
- **Error Responses**:
  - **Code**: 404 - `{ "message": "Notification not found" }`
  - **Code**: 403 - `{ "message": "Forbidden" }`

## KYC Verification

### Submit KYC document

- **URL**: `/api/kyc/submit`
- **Method**: `POST`
- **Auth required**: Yes
- **Request body**:
  ```json
  {
    "documentType": "identity_document" | "passport" | "driver_license",
    "documentNumber": "string"
  }
  ```
- **Success Response**:
  - **Code**: 201
  - **Content**: `KycDocument` object

### Get user's KYC documents

- **URL**: `/api/kyc/documents`
- **Method**: `GET`
- **Auth required**: Yes
- **Success Response**:
  - **Code**: 200
  - **Content**: Array of `KycDocument` objects

### Generate ZKP identity

- **URL**: `/api/kyc/generate-identity`
- **Method**: `POST`
- **Auth required**: Yes
- **Success Response**:
  - **Code**: 201
  - **Content**: Updated `User` object with ZKP identity

### Verify identity with ZKP

- **URL**: `/api/kyc/verify-proof`
- **Method**: `POST`
- **Auth required**: Yes
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "success": true,
      "user": "User object"
    }
    ```

## Smart Contracts

### Create escrow smart contract

- **URL**: `/api/smart-contracts/escrow`
- **Method**: `POST`
- **Auth required**: Yes
- **Request body**:
  ```json
  {
    "buyerId": "integer",
    "commodityId": "integer",
    "amount": "number"
  }
  ```
- **Success Response**:
  - **Code**: 201
  - **Content**:
    ```json
    {
      "success": true,
      "contractAddress": "string",
      "transactionHash": "string"
    }
    ```

### Deposit to escrow

- **URL**: `/api/smart-contracts/escrow/deposit`
- **Method**: `POST`
- **Auth required**: Yes
- **Request body**:
  ```json
  {
    "contractAddress": "string",
    "amount": "number"
  }
  ```
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "success": true,
      "transactionHash": "string"
    }
    ```

### Release funds from escrow

- **URL**: `/api/smart-contracts/escrow/release`
- **Method**: `POST`
- **Auth required**: Yes
- **Request body**:
  ```json
  {
    "contractAddress": "string"
  }
  ```
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "success": true,
      "transactionHash": "string"
    }
    ```

### Verify transaction status

- **URL**: `/api/smart-contracts/transaction/:hash`
- **Method**: `GET`
- **Auth required**: Yes
- **URL Params**: `hash=[string]`
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "confirmed": true,
      "blockNumber": "integer",
      "timestamp": "date"
    }
    ```

### Get token balance

- **URL**: `/api/smart-contracts/tokens/:address`
- **Method**: `GET`
- **Auth required**: Yes
- **URL Params**: `address=[string]`
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "balance": "number",
      "symbol": "string",
      "decimals": "integer"
    }
    ```

## WebSocket API

The platform provides a WebSocket API for real-time notifications:

- **WebSocket URL**: `/api/ws/notifications`
- **Authentication Message**:
  ```json
  {
    "type": "auth",
    "userId": "integer"
  }
  ```
- **Notification Message Format**:
  ```json
  {
    "type": "notification",
    "data": {
      "id": "integer",
      "userId": "integer",
      "type": "string",
      "title": "string",
      "message": "string",
      "isRead": false,
      "createdAt": "date"
    }
  }
  ```
