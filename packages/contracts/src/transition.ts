import type { ActorRef, AuthorityLevel, ProofLevel } from "./primitives";

export interface TrustedTransitionScope {
  tenantId: string;
  organizationId: string;
  companyId: string;
  projectId: string;
}

/**
 * Transition v1 is deliberately SHADOW ONLY.
 * Future production authorization requires a separately approved trust anchor.
 */
export interface ShadowTransitionRequest {
  schema: "osa.creator.shadow-transition.v1";
  mode: "SHADOW_ONLY";
  transitionId: string;
  scope: TrustedTransitionScope;
  actor: ActorRef;
  action: string;
  bindingDigest: string;
  policyDigest: string;
  requestedAuthorityLevel: AuthorityLevel;
  requiredProof: ProofLevel;
  fromStateHash: string;
  expectedVersion: number;
  idempotencyKey: string;
  mutation: StateMutation;
  mutationDigest: string;
  intentDigest: string;
}

export interface StateMutation {
  set: Readonly<Record<string, unknown>>;
}

/** Legacy shape is retained for data migration only; it is NOT an execution API. */
export interface BusinessTransitionProposal {
  transitionId: string;
  fromStateHash: string;
  proposedBy: ActorRef;
  reason: string;
  mutation: StateMutation;
  authority: import("./authority").AuthorityReceipt;
  evidenceIds: readonly string[];
  verifications: readonly import("./proof").VerificationReceipt[];
  requiredProof: ProofLevel;
}

export interface BusinessTransitionReceipt {
  transitionId: string;
  fromStateHash: string;
  toStateHash?: string;
  decision: "ACCEPT" | "REJECT";
  authorityReceiptId: string;
  evidenceIds: readonly string[];
  verificationIds: readonly string[];
  requiredProof: ProofLevel;
  reason: string;
}
