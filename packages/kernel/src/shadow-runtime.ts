import type { CompanyState } from "../../contracts/src/index";
import { sha256 } from "./canonical";

export type ForkMode = "SIMULATION" | "REPLAY" | "SHADOW" | "CANARY";

export interface CompanyFork {
  forkId: string;
  parentStateHash: string;
  parentCycle: number;
  mode: ForkMode;
  externalSideEffects: boolean;
  policyOverrides: Readonly<Record<string, unknown>>;
  providerOverrides: Readonly<Record<string, string>>;
}

export function createFork(
  parent: CompanyState,
  mode: ForkMode,
  overrides: {
    policy?: Readonly<Record<string, unknown>>;
    provider?: Readonly<Record<string, string>>;
    externalSideEffects?: boolean;
  } = {},
): CompanyFork {
  const externalSideEffects = overrides.externalSideEffects ?? false;

  if (mode !== "CANARY" && externalSideEffects) {
    throw new Error("Non-canary shadow forks cannot enable external side effects.");
  }

  return {
    forkId: `FORK-${sha256({ parent: parent.stateHash, mode, overrides }).slice(0, 12)}`,
    parentStateHash: parent.stateHash,
    parentCycle: parent.version,
    mode,
    externalSideEffects,
    policyOverrides: overrides.policy ?? {},
    providerOverrides: overrides.provider ?? {},
  };
}
