import test from "node:test";
import assert from "node:assert/strict";
import type { CapabilityPerformance } from "../../contracts/src/index";
import type { ShadowTransitionRequest } from "../../contracts/src/transition";
import {
  OfflineShadowTransitionGate,
  computeShadowMutationDigest, computeShadowIntentDigest,
  createFork, createInitialState,
  evaluateEconomicOutcome, InMemoryEventLog, routeCapability,
} from "../src/index";

function validShadowCase(requiredProof: "P3" | "P4" = "P3") {
  const state = createInitialState("COMPANY-1", { landingVersion: 0 });
  const scope = { tenantId: "tenant-1", organizationId: "org-1",
    companyId: "COMPANY-1", projectId: "project-1" };
  const gate = new OfflineShadowTransitionGate({
    scope,
    policy: { policyId: "POL-1", policyDigest: "a".repeat(64),
      requiredAuthorityLevel: "A2", minimumProofLevel: "P3",
      allowedActions: ["internal_artifact_transition"], allowedActorIds: ["planner-1"] },
    authorityIssuerId: "synthetic-gate", proofIssuerId: "synthetic-proof",
    authorityTestKey: "TEST-ONLY-AUTHORITY-NOT-PROD",
    proofTestKey: "TEST-ONLY-PROOF-NOT-PROD",
  });
  const basic = {
    schema: "osa.creator.shadow-transition.v1" as const, mode: "SHADOW_ONLY" as const,
    transitionId: "TR-1", scope,
    actor: { id: "planner-1", type: "agent" as const },
    action: "internal_artifact_transition",
    bindingDigest: "b".repeat(64), policyDigest: "a".repeat(64),
    requestedAuthorityLevel: "A2" as const, requiredProof,
    fromStateHash: state.stateHash, expectedVersion: 0,
    idempotencyKey: "idem-1", mutation: { set: { landingVersion: 1 } },
  };
  const digest = computeShadowMutationDigest(basic);
  const input = { ...basic, mutationDigest: digest };
  const req: ShadowTransitionRequest = {
    ...input, intentDigest: computeShadowIntentDigest(input),
  };
  return { state, req, gate, auth: gate.issueSyntheticAuthority(req),
    proof: gate.issueSyntheticProof(req) };
}

test("valid shadow transition computes isolated state without production commit", () => {
  const { gate, state, req, auth, proof } = validShadowCase();
  const result = gate.evaluate(state, req, auth, proof, "2026-11-22T10:00:00Z");
  assert.equal(result.status, "SIMULATED");
  assert.equal(result.productionWrite, false);
  if (result.status !== "SIMULATED") throw new Error("SHADOW_VALID_CASE_FAILED");
  assert.equal(result.shadowState.version, 1);
  assert.equal(result.shadowState.data.landingVersion, 1);
  assert.notEqual(result.shadowState.stateHash, state.stateHash);
  assert.equal(state.version, 0);
  assert.equal(state.data.landingVersion, 0);
  assert.equal(result.receipt.mode, "SHADOW_ONLY");
});

test("shadow transition is blocked without authority", () => {
  const { gate, state, req, proof } = validShadowCase();
  const auth = gate.issueSyntheticAuthority(req, { decision: "DENY" });
  assert.equal(gate.evaluate(state, req, auth, proof, "2026-11-22T10:00:00Z").status, "DENY");
});

test("shadow transition is blocked when proof is below requirement", () => {
  const { gate, state, req, auth } = validShadowCase("P4");
  const proof = gate.issueSyntheticProof(req, { proofLevel: "P3" });
  assert.equal(gate.evaluate(state, req, auth, proof, "2026-11-22T10:00:00Z").status, "DENY");
});

test("capability routing is contextual and evidence-based", () => {
  const candidates: CapabilityPerformance[] = [
    {
      capabilityId: "web-builder-a",
      providerId: "provider-a",
      capabilityType: "web_app_generation",
      contextClass: "saas",
      sampleCount: 100,
      verificationPassRate: 0.9,
      economicPassRate: 0.8,
      avgCost: 10,
      avgLatencyMs: 1000,
      failureRate: 0.02,
      riskIncidentRate: 0.01,
    },
    {
      capabilityId: "web-builder-b",
      providerId: "provider-b",
      capabilityType: "web_app_generation",
      contextClass: "saas",
      sampleCount: 100,
      verificationPassRate: 0.85,
      economicPassRate: 0.95,
      avgCost: 2,
      avgLatencyMs: 900,
      failureRate: 0.03,
      riskIncidentRate: 0.01,
    },
  ];

  const decision = routeCapability(
    {
      capabilityType: "web_app_generation",
      contextClass: "saas",
      weights: { quality: 0.1, economics: 0.5, cost: 0.25, latency: 0.05, reliability: 0.05, risk: 0.05 },
    },
    candidates,
  );

  assert.equal(decision.selected.providerId, "provider-b");
});

test("economic kernel separates technical success from business value", () => {
  const outcome = evaluateEconomicOutcome(
    {
      id: "EO-1",
      experimentId: "EXP-1",
      cost: 50,
      revenue: 100,
      acquiredCustomers: 1,
      proofLevel: "P6",
    },
    { maxCost: 100, maxCac: 60, minGrossMargin: 0.4 },
  );

  assert.equal(outcome.verdict, "ECONOMIC_PASS");
  assert.equal(outcome.cac, 50);
  assert.equal(outcome.grossMargin, 0.5);
});

test("shadow fork has no external side effects by default", () => {
  const state = createInitialState("COMPANY-1");
  const fork = createFork(state, "SHADOW");
  assert.equal(fork.externalSideEffects, false);
});

test("event log can replay deterministic projections", () => {
  const log = new InMemoryEventLog();
  log.append({
    id: "E-1",
    companyId: "COMPANY-1",
    type: "GoalDeclared",
    occurredAt: "2026-09-29T00:00:00Z",
    payload: { goal: "first customer" },
  });
  log.append({
    id: "E-2",
    companyId: "COMPANY-1",
    type: "StateAdvanced",
    occurredAt: "2026-09-29T00:00:01Z",
    causationId: "E-1",
    payload: { version: 1 },
  });

  const count = log.reduce(0, (state) => state + 1);
  assert.equal(count, 2);
});

test("invalid transition parent is rejected before any shadow state advance", () => {
  const { gate, state, req, auth, proof } = validShadowCase();
  const altered = { ...req, fromStateHash: "f".repeat(64) };
  const result = gate.evaluate(state, altered, auth, proof, "2026-11-22T10:00:00Z");
  assert.equal(result.status, "DENY");
  assert.equal(result.reason, "STATE_CAS_MISMATCH");
});