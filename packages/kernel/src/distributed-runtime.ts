import type { WorkEnvelope, WorkState } from "../../contracts/src/index";
import { KernelInvariantError } from "./errors";

const ALLOWED: Readonly<Record<WorkState, readonly WorkState[]>> = {
  CREATED: ["AUTHORIZED", "BLOCKED"],
  AUTHORIZED: ["QUEUED", "BLOCKED"],
  QUEUED: ["LEASED", "BLOCKED", "DEAD_LETTER"],
  LEASED: ["RUNNING", "QUEUED", "DEAD_LETTER"],
  RUNNING: ["EVIDENCE_PENDING", "RETRYABLE_FAILURE", "QUARANTINED"],
  EVIDENCE_PENDING: ["VERIFYING", "RETRYABLE_FAILURE"],
  VERIFYING: ["VERIFIED", "RETRYABLE_FAILURE", "QUARANTINED"],
  VERIFIED: ["TRANSITION_PENDING"],
  TRANSITION_PENDING: ["COMMITTED", "RETRYABLE_FAILURE"],
  COMMITTED: [],
  RETRYABLE_FAILURE: ["QUEUED", "DEAD_LETTER"],
  BLOCKED: [],
  QUARANTINED: ["DEAD_LETTER"],
  DEAD_LETTER: [],
};

export function advanceWorkState(work: WorkEnvelope, next: WorkState): WorkEnvelope {
  if (!ALLOWED[work.state].includes(next)) {
    throw new KernelInvariantError("INVALID_WORK_STATE_TRANSITION:" + work.state + "->" + next);
  }

  return { ...work, state: next };
}
