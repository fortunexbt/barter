import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

interface PrototypeIdentity {
  commitment: string;
  secret: string;
}

interface PrototypeProof {
  version: "prototype-proof-v1";
  commitment: string;
  signal: string;
  response: string;
}

const members = new Set<string>();
const experimentSecrets = new Map<string, string>();

function digest(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function isPrototypeIdentity(value: unknown): value is PrototypeIdentity {
  if (!value || typeof value !== "object") return false;
  const identity = value as Partial<PrototypeIdentity>;
  return typeof identity.commitment === "string" && typeof identity.secret === "string";
}

/**
 * Compatibility service for the legacy identity-flow screens.
 *
 * This is deliberately not a zero-knowledge proof system and must never be
 * treated as KYC. It provides an inspectable, local challenge-response fixture
 * without retaining the vulnerable cryptography dependency tree from the
 * original prototype.
 */
export class ZKPService {
  static initialize() {
    return members;
  }

  static createIdentity(): {
    identity: PrototypeIdentity;
    identityCommitment: string;
    serializedIdentity: string;
  } {
    const secret = randomBytes(32).toString("hex");
    const commitment = digest(`barter-prototype:${secret}`);
    const identity = { commitment, secret };

    experimentSecrets.set(commitment, secret);

    return {
      identity,
      identityCommitment: commitment,
      serializedIdentity: JSON.stringify(identity),
    };
  }

  static deserializeIdentity(serializedIdentity: string): PrototypeIdentity | null {
    try {
      const identity: unknown = JSON.parse(serializedIdentity);
      if (!isPrototypeIdentity(identity)) return null;
      if (digest(`barter-prototype:${identity.secret}`) !== identity.commitment) return null;

      experimentSecrets.set(identity.commitment, identity.secret);
      members.add(identity.commitment);
      return identity;
    } catch {
      return null;
    }
  }

  static addMember(identityCommitment: string): boolean {
    if (!experimentSecrets.has(identityCommitment)) return false;
    members.add(identityCommitment);
    return true;
  }

  static async generateVerificationProof(
    identity: PrototypeIdentity,
    signal: string,
  ): Promise<{
    proofData: string;
    merkleTreeRoot: string;
    nullifierHash: string;
  }> {
    if (!members.has(identity.commitment)) {
      throw new Error("Experiment identity is not registered");
    }

    const proof: PrototypeProof = {
      version: "prototype-proof-v1",
      commitment: identity.commitment,
      signal,
      response: createHmac("sha256", identity.secret).update(signal).digest("hex"),
    };

    return {
      proofData: JSON.stringify(proof),
      merkleTreeRoot: digest([...members].sort().join("|")),
      nullifierHash: digest(`${identity.commitment}:${signal}`),
    };
  }

  static async verifyIdentityProof(proofData: string): Promise<boolean> {
    try {
      const parsed: unknown = JSON.parse(proofData);
      if (!parsed || typeof parsed !== "object") return false;

      const proof = parsed as Partial<PrototypeProof>;
      if (
        proof.version !== "prototype-proof-v1" ||
        typeof proof.commitment !== "string" ||
        typeof proof.signal !== "string" ||
        typeof proof.response !== "string" ||
        !members.has(proof.commitment)
      ) {
        return false;
      }

      const secret = experimentSecrets.get(proof.commitment);
      if (!secret) return false;

      const expected = createHmac("sha256", secret).update(proof.signal).digest();
      const received = Buffer.from(proof.response, "hex");

      return received.length === expected.length && timingSafeEqual(received, expected);
    } catch {
      return false;
    }
  }
}
