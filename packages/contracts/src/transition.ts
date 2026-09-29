import type { ActorRef, ProofLevel, TransitionDecision } from "./primitives";
import type { AuthorityReceipt } from "./authority";
import type { VerificationReceipt } from "./proof";

export interface StateMutation {
  set: Readonly<Record<string, unknown>>;
}

export interface BusinessTransitionProposal {
  transitionId: string;
  fromStateHash: string;
  proposedBy: ActorRef;
  reason: string;
  mutation: StateMutation;
  authority: AuthorityReceipt;
  evidenceIds: readonly string[];
  verifications: readonly VerificationReceipt[];
  requiredProof: ProofLevel;
}

export interface BusinessTransitionReceipt {
  transitionId: string;
  fromStateHash: string;
  toStateHash?: string;
  decision: TransitionDecision;
  authorityReceiptId: string;
  evidenceIds: readonly string[];
  verificationIds: readonly string[];
  requiredProof: ProofLevel;
  reason: string;
}
