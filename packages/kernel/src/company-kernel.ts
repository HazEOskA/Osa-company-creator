import type { CompanyState } from "../../contracts/src/index";
import { sha256 } from "./canonical";

/**
 * Only initializes a local company-state value.
 *
 * SECURITY: The former export applyTransition(current, proposal) was removed.
 * It trusted caller-supplied authority.allowed and proof.result. There is NO
 * production mutation API until an independent trust anchor is implemented.
 * For simulation, use OfflineShadowTransitionGate from trusted-transition.ts.
 */
export function createInitialState(
  companyId: string,
  data: Readonly<Record<string, unknown>> = {},
): CompanyState {
  if (!/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/.test(companyId)) {
    throw new Error("INVALID_COMPANY_ID");
  }
  const version = 0;
  return {
    companyId, version, data: { ...data },
    stateHash: sha256({ companyId, version, data }),
  };
}
