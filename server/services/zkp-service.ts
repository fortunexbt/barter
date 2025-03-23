import { Identity } from '@semaphore-protocol/identity';
import { Group } from '@semaphore-protocol/group';
import { generateProof, verifyProof } from '@semaphore-protocol/proof';

// Unique group ID for the barter platform
const BARTER_TRADE_GROUP_ID = BigInt(1);

// In-memory group for demo purposes, in production this would be stored in a database
let zkpGroup: Group | null = null;

export class ZKPService {
  /**
   * Initializes the ZKP group for user identities
   */
  static initialize() {
    if (!zkpGroup) {
      // Create a new group with ID 1 and zero members initially
      zkpGroup = new Group();
    }
    return zkpGroup;
  }

  /**
   * Creates a new identity for a user
   * @returns The identity commitment and serialized identity data
   */
  static createIdentity(): { 
    identity: Identity, 
    identityCommitment: string,
    serializedIdentity: string
  } {
    // Create a new Semaphore identity
    const identity = new Identity();
    
    return {
      identity,
      identityCommitment: identity.commitment.toString(),
      // Serialize the identity for storage
      serializedIdentity: JSON.stringify({
        commitment: identity.commitment.toString(),
        // We store the entire identity as a string
        identityString: identity.toString()
      })
    };
  }
  
  /**
   * Recreates an identity from serialized data
   */
  static deserializeIdentity(serializedIdentity: string): Identity | null {
    try {
      const { identityString } = JSON.parse(serializedIdentity);
      // Create a new identity from the stored trapdoor and nullifier
      return new Identity(identityString);
    } catch (error) {
      console.error('Error deserializing identity:', error);
      return null;
    }
  }

  /**
   * Registers a user's identity commitment to the group
   */
  static addMember(identityCommitment: string): boolean {
    try {
      const group = this.initialize();
      group.addMember(BigInt(identityCommitment));
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
    proofData: string,
    merkleTreeRoot: string,
    nullifierHash: string
  }> {
    const group = this.initialize();
    
    try {
      // Signal is the external data we're proving, like a document hash
      const externalNullifier = BARTER_TRADE_GROUP_ID;
      
      // Generate a full proof
      const fullProof = await generateProof(
        identity, 
        group, 
        externalNullifier, 
        signal
      );
      
      // For simplicity, we'll serialize the entire proof object
      return {
        proofData: JSON.stringify(fullProof),
        merkleTreeRoot: group.root.toString(),
        nullifierHash: fullProof.nullifier?.toString() || ""
      };
    } catch (error) {
      console.error('Error generating ZKP proof:', error);
      throw new Error('Failed to generate zero-knowledge proof');
    }
  }

  /**
   * Verifies a zero-knowledge proof
   */
  static async verifyIdentityProof(proofDataStr: string): Promise<boolean> {
    try {
      // Parse the proof data
      const fullProof = JSON.parse(proofDataStr);
      
      // Verify the proof
      const isValid = await verifyProof(fullProof);
      
      return isValid;
    } catch (error) {
      console.error('Error verifying ZKP proof:', error);
      return false;
    }
  }
}