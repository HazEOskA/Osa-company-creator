export type CompanyEventType =
  | "GoalDeclared"
  | "HypothesisCreated"
  | "ExperimentDefined"
  | "AuthorityGranted"
  | "AuthorityDenied"
  | "CapabilitySelected"
  | "ExecutionStarted"
  | "EvidenceRecorded"
  | "VerificationPassed"
  | "VerificationFailed"
  | "EconomicOutcomeRecorded"
  | "TransitionAccepted"
  | "TransitionRejected"
  | "StateAdvanced"
  | "ForkCreated"
  | "ReplayCompleted"
  | "ChallengerPromoted"
  | "ChallengerRejected"
  | "CircuitBreakerTriggered"
  | "TenantScopeViolationDetected"
  | "SecretScopeViolationDetected"
  | "WorkQueued"
  | "WorkLeased"
  | "LeaseExpired"
  | "WorkCommitted"
  | "DeadLettered"
  | "ProviderQuarantined"
  | "OutboxPublished";

export interface CompanyEvent<T = unknown> {
  id: string;
  companyId: string;
  type: CompanyEventType;
  occurredAt: string;
  causationId?: string;
  payload: T;
}
