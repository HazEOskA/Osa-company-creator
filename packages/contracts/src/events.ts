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
  | "CircuitBreakerTriggered";

export interface CompanyEvent<T = unknown> {
  id: string;
  companyId: string;
  type: CompanyEventType;
  occurredAt: string;
  causationId?: string;
  payload: T;
}
