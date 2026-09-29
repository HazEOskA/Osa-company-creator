import test from "node:test";
import assert from "node:assert/strict";
import type {
  BusinessTransitionProposal,
  CapabilityPerformance,
  VerificationReceipt,
} from "../../contracts/src/index";
import {
  applyTransition,
  createFork,
  createInitialState,
  evaluateAuthority,
  evaluateEconomicOutcome,
  InMemoryEventLog,
  KernelInvariantError,
  routeCapability,
} from "../src/index";

const p3: VerificationReceipt = {
  id: "VR-1",
  subject: "artifact://landing-v1",
  verifier: "deterministic-test-suite",
  proofLevel: "P3",
  checks: [{ id: "build", description: "Build passes", passed: true }],
  result: "PASS",
};

function validProposal(stateHash: string): BusinessTransitionProposal {
  return {
    transitionId: "TR-1",
    fromStateHash: stateHash,
    proposedBy: { id: "planner-1", type: "agent" },
    reason: "Verified experiment advanced the company state.",
    mutation: { set: { landingVersion: 1 } },
    authority: evaluateAuthority({
      actor: { id: "planner-1", type: "agent" },
      action: "internal_artifact_transition",
      requiredLevel: "A2",
      grantedLevel: "A2",
      policyId: "POL-1",
      policyAllows: true,
    }),
    evidenceIds: ["EV-1"],
    verifications: [p3],
    requiredProof: "P3",
  };
}

test("valid transition advances state and produces a new hash", () => {
  const state = createInitialState("COMPANY-1", { landingVersion: 0 });
  const result = applyTransition(state, validProposal(state.stateHash));

  assert.equal(result.state.version, 1);
  assert.equal(result.state.data.landingVersion, 1);
  assert.notEqual(result.state.stateHash, state.stateHash);
  assert.equal(result.receipt.decision, "ACCEPT");
});

test("state mutation is blocked without authority", () => {
  const state = createInitialState("COMPANY-1");
  const proposal = validProposal(state.stateHash);
  proposal.authority = { ...proposal.authority, allowed: false };

  assert.throws(() => applyTransition(state, proposal), /NO AUTHORITY/);
});

test("state mutation is blocked when proof is below requirement", () => {
  const state = createInitialState("COMPANY-1");
  const proposal = validProposal(state.stateHash);
  proposal.requiredProof = "P4";

  assert.throws(() => applyTransition(state, proposal), /NO REQUIRED PROOF/);
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

test("invalid transition parent is rejected", () => {
  const state = createInitialState("COMPANY-1");
  const proposal = validProposal("wrong-parent");
  assert.throws(
    () => applyTransition(state, proposal),
    { message: /parent does not match/ },
  );
});
