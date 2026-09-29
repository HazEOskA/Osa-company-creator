export type CircuitBreakerState = "CLOSED" | "OPEN";

export interface CircuitBreakerConfig {
  failureThreshold: number;
}

export interface ServiceHealth {
  live: boolean;
  ready: boolean;
  reasons: readonly string[];
}

export interface RuntimeSloSnapshot {
  transitionDurability: number;
  unauthorizedTransitionAcceptances: number;
  crossTenantLeakageEvents: number;
  lostCommittedTransitions: number;
  replayDivergenceEvents: number;
}
