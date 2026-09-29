import type { AuthorityLevel, ProofLevel } from "./primitives";

export interface GoalContract {
  id: string;
  objective: string;
  successMetric: string;
  successThreshold: number;
  maxBudget?: number;
  deadline?: string;
}

export interface CompanyCharter {
  mission: string;
  currency: string;
  authorityCeiling: AuthorityLevel;
  prohibitedActions: readonly string[];
  successMetrics: readonly string[];
}

export interface CompanyState {
  companyId: string;
  version: number;
  stateHash: string;
  data: Readonly<Record<string, unknown>>;
}

export interface CompanyIR {
  companyId: string;
  version: number;
  charter: CompanyCharter;
  goals: readonly GoalContract[];
  requiredProof: ProofLevel;
  state: CompanyState;
}
