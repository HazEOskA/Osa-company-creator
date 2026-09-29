export interface CapabilityPerformance {
  capabilityId: string;
  providerId: string;
  capabilityType: string;
  contextClass: string;
  sampleCount: number;
  verificationPassRate: number;
  economicPassRate: number;
  avgCost: number;
  avgLatencyMs: number;
  failureRate: number;
  riskIncidentRate: number;
}

export interface RoutingWeights {
  quality: number;
  economics: number;
  cost: number;
  latency: number;
  reliability: number;
  risk: number;
}

export interface RoutingRequest {
  capabilityType: string;
  contextClass: string;
  weights: RoutingWeights;
}

export interface RoutingDecision {
  selected: CapabilityPerformance;
  score: number;
  ranked: ReadonlyArray<{ candidate: CapabilityPerformance; score: number }>;
}
