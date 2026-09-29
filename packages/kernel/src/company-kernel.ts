import type {
  BusinessTransitionProposal,
  BusinessTransitionReceipt,
  CompanyState,
} from "../../contracts/src/index";
import { sha256 } from "./canonical";
import { KernelInvariantError } from "./errors";
import { evaluateProof } from "./proof-kernel";

function stateDigest(companyId: string, version: number, data: Readonly<Record<string, unknown>>): string {
  return sha256({ companyId, version, data });
}

export function createInitialState(
  companyId: string,
  data: Readonly<Record<string, unknown>> = {},
): CompanyState {
  const version = 0;
  return {
    companyId,
    version,
    data: { ...data },
    stateHash: stateDigest(companyId, version, data),
  };
}

export function applyTransition(
  current: CompanyState,
  proposal: BusinessTransitionProposal,
): { state: CompanyState; receipt: BusinessTransitionReceipt } {
  if (proposal.fromStateHash !== current.stateHash) {
    throw new KernelInvariantError("Transition parent does not match current company state.");
  }

  if (!proposal.authority.allowed) {
    throw new KernelInvariantError("NO AUTHORITY -> NO EXECUTION / STATE MUTATION.");
  }

  const proof = evaluateProof({
    requiredLevel: proposal.requiredProof,
    evidence: proposal.evidenceIds.map((id) => ({ id })),
    verifications: proposal.verifications,
  });

  if (!proof.passed) {
    throw new KernelInvariantError("NO REQUIRED PROOF -> NO SUCCESS: ${proof.reason}");
  }

  const nextVersion = current.version + 1;
  const nextData = Object.freeze({ ...current.data, ...proposal.mutation.set });
  const nextState: CompanyState = {
    companyId: current.companyId,
    version: nextVersion,
    data: nextData,
    stateHash: stateDigest(current.companyId, nextVersion, nextData),
  };

  const receipt: BusinessTransitionReceipt = {
    transitionId: proposal.transitionId,
    fromStateHash: current.stateHash,
    toStateHash: nextState.stateHash,
    decision: "ACCEPT",
    authorityReceiptId: proposal.authority.id,
    evidenceIds: [...proposal.evidenceIds],
    verificationIds: proposal.verifications.map((item) => item.id),
    requiredProof: proposal.requiredProof,
    reason: proposal.reason,
  };

  return { state: nextState, receipt };
}
