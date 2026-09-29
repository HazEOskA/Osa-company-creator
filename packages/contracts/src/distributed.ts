import type { ProofLevel } from "./primitives";

export type WorkState =
  | "CREATED"
  | "AUTHORIZED"
  | "QUEUED"
  | "LEASED"
  | "RUNNING"
  | "EVIDENCE_PENDING"
  | "VERIFYING"
  | "VERIFIED"
  | "TRANSITION_PENDING"
  | "COMMITTED"
  | "RETRYABLE_FAILURE"
  | "BLOCKED"
  | "QUARANTINED"
  | "DEAD_LETTER";

export interface WorkEnvelope {
  protocolVersion: string;
  workId: string;
  tenantId: string;
  companyId: string;
  executionId: string;
  capability: string;
  authorityReceiptId: string;
  requiredProof: ProofLevel;
  inputRef: string;
  deadline: string;
  idempotencyKey: string;
  attempt: number;
  state: WorkState;
}

export interface WorkLease {
  workId: string;
  workerId: string;
  generation: number;
  issuedAt: string;
  expiresAt: string;
}

export interface ProtocolEvent {
  protocolVersion: string;
  eventId: string;
  tenantId: string;
  companyId: string;
  eventType: string;
  source: string;
  causationId?: string;
  correlationId: string;
  sequence: number;
  occurredAt: string;
  payloadHash: string;
  payloadRef: string;
}

export interface OutboxRecord {
  id: string;
  event: ProtocolEvent;
  publishedAt?: string;
}

export interface DeadLetterItem {
  work: WorkEnvelope;
  failureClass: string;
  attempts: number;
  evidenceIds: readonly string[];
}
