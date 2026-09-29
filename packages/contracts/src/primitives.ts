export const PROOF_LEVELS = ["P0", "P1", "P2", "P3", "P4", "P5", "P6"] as const;
export type ProofLevel = (typeof PROOF_LEVELS)[number];

export const AUTHORITY_LEVELS = ["A0", "A1", "A2", "A3", "A4", "A5", "A6"] as const;
export type AuthorityLevel = (typeof AUTHORITY_LEVELS)[number];

export type VerificationResult = "PASS" | "FAIL" | "INCONCLUSIVE";
export type TransitionDecision = "ACCEPT" | "REJECT";
export type EconomicVerdict = "ECONOMIC_PASS" | "ECONOMIC_FAIL" | "INCONCLUSIVE";

export interface ActorRef {
  id: string;
  type: "human" | "agent" | "service";
}

export interface EvidenceRef {
  id: string;
}
