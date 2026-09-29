import type { EvidenceRef, ProofLevel, VerificationResult } from "./primitives";

export interface VerificationCheck {
  id: string;
  description: string;
  passed: boolean;
}

export interface VerificationReceipt {
  id: string;
  subject: string;
  verifier: string;
  proofLevel: ProofLevel;
  checks: readonly VerificationCheck[];
  result: VerificationResult;
}

export interface ProofRequirement {
  requiredLevel: ProofLevel;
  evidence: readonly EvidenceRef[];
  verifications: readonly VerificationReceipt[];
}
