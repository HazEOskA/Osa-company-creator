import type { EconomicVerdict, ProofLevel } from "./primitives";

export interface EconomicConstraints {
  maxCost?: number;
  maxCac?: number;
  minGrossMargin?: number;
}

export interface EconomicOutcomeInput {
  id: string;
  experimentId: string;
  transitionId?: string;
  cost: number;
  revenue: number;
  acquiredCustomers: number;
  proofLevel: ProofLevel;
}

export interface EconomicOutcome extends EconomicOutcomeInput {
  cac: number | null;
  grossMargin: number | null;
  verdict: EconomicVerdict;
  reasons: readonly string[];
}
