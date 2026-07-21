
# User Flows Documentation

> **Archived concept flows.** These sequences describe the original UI intent, not real KYC, custody, blockchain settlement, market access, or asset movement. The revived `/lab` route is the supported deterministic demonstration.

This document outlines the key user flows in the BarterTrade platform.

## 1. User Registration and Onboarding

1. User navigates to the platform
2. User clicks "Sign Up" and fills out registration form
3. User submits registration form
4. System creates user account with "pending" KYC status
5. User is logged in automatically
6. Welcome modal appears explaining KYC requirements
7. User is prompted to complete KYC verification

## 2. KYC Verification Flow

1. User navigates to Profile page
2. User selects KYC tab
3. User uploads identification documents
4. User submits KYC information
5. Admin reviews KYC documents (or system auto-verifies in demo)
6. User receives notification when KYC is approved
7. User gains full access to trading features

## 3. Zero-Knowledge Proof Identity Verification

1. User navigates to Profile page, KYC tab
2. User selects "Generate ZKP Identity"
3. System generates a ZKP identity and commitment
4. User is prompted to verify their identity with ZKP
5. System verifies the proof without revealing sensitive information
6. User's profile is updated with "ZKP Verified" status

## 4. Commodity Listing

1. User navigates to Marketplace
2. User clicks "List New Commodity"
3. User fills out commodity details form
4. User submits the form
5. System creates new commodity listing
6. Commodity appears in the marketplace

## 5. Barter Offer Creation

1. User navigates to a commodity details page
2. User clicks "Make Barter Offer"
3. User selects one of their commodities to offer in exchange
4. User sets offer quantities and terms
5. User submits the offer
6. System creates barter offer
7. Commodity owner receives notification of new offer

## 6. Barter Offer Acceptance

1. Commodity owner receives barter offer notification
2. Owner navigates to Barter page
3. Owner reviews offer details
4. Owner accepts the offer
5. System creates a contract between parties
6. Both parties receive notification of the new contract

## 7. Contract Signing

1. Buyer receives contract notification
2. Buyer navigates to Contracts page
3. Buyer reviews contract details
4. Buyer signs (accepts) the contract
5. Seller receives notification of signed contract
6. Contract status changes to "active"

## 8. Smart Contract Escrow

1. Seller creates an escrow contract
2. Buyer receives notification to fund escrow
3. Buyer deposits funds to escrow smart contract
4. Seller ships the commodity
5. Buyer confirms receipt
6. Buyer releases funds from escrow
7. Transaction is completed

## 9. Notification Management

1. User receives notification (bell icon shows count)
2. User clicks notification bell
3. User views list of notifications
4. User clicks on a notification to mark as read
5. User can navigate to relevant section from notification

## 10. User Profile Management

1. User navigates to Profile page
2. User edits profile information
3. User updates preferences
4. User saves changes
5. Profile is updated in the system
