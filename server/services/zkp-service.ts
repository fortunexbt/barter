import { Identity } from '@semaphore-protocol/identity';
import { Group } from '@semaphore-protocol/group';
import { generateProof, verifyProof } from '@semaphore-protocol/proof';

const BARTER_TRADE_GROUP_ID = 1;

// In-memory group for demo purposes, in production this would be stored in a database
let zkpGroup: Group | null = null;

export class ZKPService {
  /**
   * Initializes the ZKP group for user identities
   */
  static initialize() {
    if (!zkpGroup) {
      zkpGroup = new Group(BARTER_TRADE_GROUP_ID);
    }
    return zkpGroup;
  }

  /**
   * Creates a new identity for a user
   * @returns The identity commitment and trapdoor/nullifier for storing by the user
   */
  static createIdentity(): { 
    identity: Identity, 
    identityCommitment: string,
    trapdoor: string,
    nullifier: string
  } {
    const identity = new Identity();
    
    return {
      identity,
      identityCommitment: identity.commitment.toString(),
      trapdoor: identity.trapdoor.toString(),
      nullifier: identity.nullifier.toString()
    };
  }

  /**
   * Registers a user's identity commitment to the group
   */
  static addMember(identityCommitment: string): boolean {
    try {
      const group = this.initialize();
      group.addMember(identityCommitment);
      return true;
    } catch (error) {
      console.error('Error adding member to ZKP group:', error);
      return false;
    }
  }

  /**
   * Generates a zero-knowledge proof that a user is part of the verified group
   * without revealing which specific user they are
   */
  static async generateVerificationProof(
    identity: Identity,
    signal: string // The data being verified, could be a document hash
  ): Promise<{
    fullProof: any,
    solidityProof: string,
    merkleTreeRoot: string,
    nullifierHash: string
  }> {
    const group = this.initialize();
    
    const fullProof = await generateProof(
      identity,
      group,
      group.id,
      signal
    );
    
    // Format the proof for solidity verification (if using blockchain)
    const solidityProof = fullProof.proof;
    
    return {
      fullProof,
      solidityProof,
      merkleTreeRoot: fullProof.merkleTreeRoot,
      nullifierHash: fullProof.nullifierHash
    };
  }

  /**
   * Verifies a zero-knowledge proof
   */
  static async verifyIdentityProof(
    merkleTreeRoot: string,
    signal: string,
    nullifierHash: string,
    proof: string
  ): Promise<boolean> {
    try {
      const isValid = await verifyProof(
        {
          merkleTreeRoot,
          signal,
          nullifierHash,
          proof
        },
        BARTER_TRADE_GROUP_ID
      );
      
      return isValid;
    } catch (error) {
      console.error('Error verifying ZKP proof:', error);
      return false;
    }
  }
}