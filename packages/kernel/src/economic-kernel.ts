import type {
  EconomicConstraints,
  EconomicOutcome,
  EconomicOutcomeInput,
} from "../../contracts/src/index";

export function evaluateEconomicOutcome(
  input: EconomicOutcomeInput,
  constraints: EconomicConstraints,
): EconomicOutcome {
  const cac = input.acquiredCustomers > 0 ? input.cost / input.acquiredCustomers : null;
  const grossMargin = input.revenue > 0 ? (input.revenue - input.cost) / input.revenue : null;
  const reasons: string[] = [];

  if (constraints.maxCost !== undefined && input.cost > constraints.maxCost) {
    reasons.push(`Cost ${input.cost} exceeds maxCost ${constraints.maxCost}.`);
  }

  if (constraints.maxCac !== undefined && (cac === null || cac > constraints.maxCac)) {
    reasons.push(cac === null ? "CAC cannot be proven without an acquired customer." : `CAC ${cac} exceeds maxCac ${constraints.maxCac}.`);
  }

  if (
    constraints.minGrossMargin !== undefined &&
    (grossMargin === null || grossMargin < constraints.minGrossMargin)
  ) {
    reasons.push(
      grossMargin === null
        ? "Gross margin cannot be proven without revenue."
        : `Gross margin ${grossMargin} is below minimum ${constraints.minGrossMargin}.`,
    );
  }

  return {
    ...input,
    cac,
    grossMargin,
    verdict: reasons.length === 0 ? "ECONOMIC_PASS" : "ECONOMIC_FAIL",
    reasons,
  };
}
