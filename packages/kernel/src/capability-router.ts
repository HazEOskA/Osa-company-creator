import type {
  CapabilityPerformance,
  RoutingDecision,
  RoutingRequest,
  RoutingWeights,
} from "../../contracts/src/index";
import { KernelInvariantError } from "./errors";

function score(candidate: CapabilityPerformance, weights: RoutingWeights): number {
  const costScore = 1 / (1 + Math.max(0, candidate.avgCost));
  const latencyScore = 1 / (1 + Math.max(0, candidate.avgLatencyMs) / 1000);
  const reliabilityScore = 1 - candidate.failureRate;
  const riskScore = 1 - candidate.riskIncidentRate;

  return (
    candidate.verificationPassRate * weights.quality +
    candidate.economicPassRate * weights.economics +
    costScore * weights.cost +
    latencyScore * weights.latency +
    reliabilityScore * weights.reliability +
    riskScore * weights.risk
  );
}

export function routeCapability(
  request: RoutingRequest,
  candidates: readonly CapabilityPerformance[],
): RoutingDecision {
  const eligible = candidates.filter(
    (candidate) =>
      candidate.capabilityType === request.capabilityType &&
      (candidate.contextClass === request.contextClass || candidate.contextClass === "*"),
  );

  if (eligible.length === 0) {
    throw new KernelInvariantError("No eligible capability exists for this task and context.");
  }

  const ranked = eligible
    .map((candidate) => ({ candidate, score: score(candidate, request.weights) }))
    .sort((a, b) => b.score - a.score);

  const selected = ranked[0];
  if (!selected) {
    throw new KernelInvariantError("Routing produced no candidate.");
  }

  return { selected: selected.candidate, score: selected.score, ranked };
}
