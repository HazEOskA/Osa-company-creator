import test from "node:test";
import assert from "node:assert/strict";
import type { ShadowTransitionRequest, TrustedTransitionScope } from "../../contracts/src/transition";
import type { AuthorityLevel, ProofLevel } from "../../contracts/src/primitives";
import {
  OfflineShadowTransitionGate, createInitialState, evaluateProof,
  computeShadowMutationDigest, computeShadowIntentDigest,
} from "../src/index";
import * as kernelModule from "../src/company-kernel";
import * as publicKernel from "../src/index";

const NOW = "2026-11-22T10:00:00Z";
const SCOPE: TrustedTransitionScope = {
  tenantId: "tenant-1", organizationId: "org-1",
  companyId: "company-1", projectId: "project-1",
};
function scenario(options: {
  minimumProofLevel?: ProofLevel;
  requiredAuthorityLevel?: AuthorityLevel;
} = {}) {
  const state = createInitialState("company-1", { stage: "DRAFT" });
  const gate = new OfflineShadowTransitionGate({
    scope: SCOPE,
    policy: {
      policyId: "policy-1", policyDigest: "a".repeat(64),
      minimumProofLevel: options.minimumProofLevel ?? "P3",
      requiredAuthorityLevel: options.requiredAuthorityLevel ?? "A2",
      allowedActions: ["update_internal_draft"],
      allowedActorIds: ["actor-1"],
    },
    authorityIssuerId: "offline-authority",
    proofIssuerId: "offline-proof",
    authorityTestKey: "P04D2_AUTHORITY_FIXTURE_NOT_REAL_SECRET",
    proofTestKey: "P04D2_PROOF_FIXTURE_NOT_REAL_SECRET",
  });
  const base = {
    schema: "osa.creator.shadow-transition.v1" as const, mode: "SHADOW_ONLY" as const,
    transitionId: "transition-1", scope: { ...SCOPE },
    actor: { id: "actor-1", type: "agent" as const },
    action: "update_internal_draft", bindingDigest: "b".repeat(64),
    policyDigest: "a".repeat(64),
    requestedAuthorityLevel: options.requiredAuthorityLevel ?? "A2",
    requiredProof: options.minimumProofLevel ?? "P3",
    fromStateHash: state.stateHash, expectedVersion: state.version,
    idempotencyKey: "idempotency-1",
    mutation: { set: { stage: "REVIEW" } },
  };
  const mutationDigest = computeShadowMutationDigest(base);
  const req: ShadowTransitionRequest = {
    ...base, mutationDigest,
    intentDigest: computeShadowIntentDigest({ ...base, mutationDigest }),
  };
  return { state, gate, req,
    auth: gate.issueSyntheticAuthority(req), proof: gate.issueSyntheticProof(req) };
}
function evaluate(s: ReturnType<typeof scenario>,
  overrides: {
    req?: ShadowTransitionRequest;
    auth?: ReturnType<typeof s.gate.issueSyntheticAuthority> | null;
    proof?: ReturnType<typeof s.gate.issueSyntheticProof> | null;
    now?: string;
  } = {}) {
  return s.gate.evaluate(s.state, overrides.req ?? s.req,
    overrides.auth === undefined ? s.auth : overrides.auth,
    overrides.proof === undefined ? s.proof : overrides.proof, overrides.now ?? NOW);
}

test("H-01: positive synthetic tenant, authority, proof and CAS permit shadow only", () => {
  const s = scenario();
  const before = structuredClone(s.state);
  const result = evaluate(s);
  assert.equal(result.status, "SIMULATED");
  assert.equal(result.productionWrite, false);
  if (result.status !== "SIMULATED") throw new Error("NO_SHADOW_RESULT");
  assert.equal(result.receipt.mode, "SHADOW_ONLY");
  assert.equal(result.shadowState.version, before.version + 1);
  assert.equal(result.shadowState.data.stage, "REVIEW");
  assert.deepEqual(s.state, before);
});

test("H-02: signed policyAllows=false overrides any claimed ALLOW", () => {
  const s = scenario();
  const auth = s.gate.issueSyntheticAuthority(s.req, { policyAllows: false });
  assert.deepEqual(evaluate(s, {auth}).status, "DENY");
});

test("H-03: granted A0 cannot fulfill required A6", () => {
  const s = scenario({requiredAuthorityLevel:"A6"});
  const auth = s.gate.issueSyntheticAuthority(s.req, {grantedLevel:"A0"});
  const result=evaluate(s,{auth});
  assert.equal(result.status,"DENY");
  assert.equal(result.reason,"AUTHORITY_DENIED");
});

test("H-04: untrusted authority issuer and modified synthetic signature fail closed", () => {
  const s=scenario();
  const forged=s.gate.issueSyntheticAuthority(s.req, {issuerId:"foreign-authority"});
  assert.equal(evaluate(s,{auth:forged}).status,"UNKNOWN");
  const altered={...s.auth,decision:"DENY" as const};
  assert.equal(evaluate(s,{auth:altered}).status,"DENY");
});

test("H-05: expired or not-yet-issued authority is rejected", () => {
  const s=scenario();
  assert.equal(evaluate(s,{auth:s.gate.issueSyntheticAuthority(s.req,{
    expiresAt:"2020-01-01T00:00:00Z",
  })}).status,"DENY");
  assert.equal(evaluate(s,{auth:s.gate.issueSyntheticAuthority(s.req,{
    issuedAt:"2031-01-01T00:00:00Z",
  })}).status,"DENY");
});

test("H-06: mutated action parameters after authorization reject the intent", () => {
  const s=scenario();
  const req={...s.req,mutation:{set:{stage:"PUBLISHED"}}};
  assert.equal(evaluate(s,{req}).status,"DENY");
  const policyChanged={...s.req,policyDigest:"c".repeat(64)};
  assert.equal(evaluate(s,{req:policyChanged}).status,"DENY");
});

test("H-07: signed PASS receipt containing a failed individual check is denied", () => {
  const s=scenario();
  const proof=s.gate.issueSyntheticProof(s.req,{
    result:"PASS",checks:[{id:"required-check",passed:false}],
  });
  assert.equal(evaluate(s,{proof}).status,"DENY");
  const legacyProof = evaluateProof({
    requiredLevel: "P3",
    evidence: [{ id: "synthetic-evidence" }],
    verifications: [{
      id: "synthetic-verification", subject: "shadow-artifact",
      verifier: "fixture", proofLevel: "P3", result: "PASS",
      checks: [{ id: "required-check", description: "Test control", passed: false }],
    }],
  });
  assert.equal(legacyProof.passed, false);
});

test("H-08: absent or foreign proof issuer never establishes trusted provenance", () => {
  const s=scenario();
  assert.equal(evaluate(s,{proof:null}).status,"UNKNOWN");
  assert.equal(evaluate(s,{proof:s.gate.issueSyntheticProof(s.req,{
    issuerId:"unrecognized-verifier",
  })}).status,"UNKNOWN");
});

test("H-09: proof must bind to exact intent, subject and binding digest", () => {
  const s=scenario();
  for (const change of [
    {subjectDigest:"f".repeat(64)},
    {bindingDigest:"e".repeat(64)},
    {intentDigest:"d".repeat(64)},
  ]) {
    const proof=s.gate.issueSyntheticProof(s.req,change);
    assert.equal(evaluate(s,{proof}).status,"DENY");
  }
});

test("H-10: foreign tenant and company have no shadow authority", () => {
  const s=scenario();
  assert.equal(evaluate(s,{req:{...s.req,scope:{...SCOPE,tenantId:"tenant-2"}}}).status,"DENY");
  const foreignState=createInitialState("other-company");
  assert.equal(s.gate.evaluate(foreignState,s.req,s.auth,s.proof,NOW).status,"DENY");
});

test("H-11: projectId mismatch with trusted directory is denied", () => {
  const s=scenario();
  const req={...s.req,scope:{...SCOPE,projectId:"project-2"}};
  assert.equal(evaluate(s,{req}).status,"DENY");
});

test("H-12: mismatched fromStateHash is denied before intent acceptance", () => {
  const s=scenario();
  assert.equal(evaluate(s,{req:{...s.req,fromStateHash:"f".repeat(64)}}).status,"DENY");
});

test("H-13: stale expectedVersion and internally inconsistent stateHash fail CAS", () => {
  const s=scenario();
  assert.equal(evaluate(s,{req:{...s.req,expectedVersion:100}}).status,"DENY");
  const forged={...s.state,version:1};
  assert.equal(s.gate.evaluate(forged,s.req,s.auth,s.proof,NOW).status,"DENY");
});

test("H-14: idempotency replay with changed payload must be rejected", () => {
  const s=scenario();
  const first=evaluate(s);
  assert.equal(first.status,"SIMULATED");
  if (first.status === "SIMULATED") {
    (first.shadowState.data as { stage: string }).stage = "CLIENT_MUTATION";
  }
  const replay=evaluate(s);
  assert.equal(replay.status,"SIMULATED");
  if (replay.status === "SIMULATED") {
    assert.equal(replay.shadowState.data.stage, "REVIEW");
  }
  const changed={...s.req,transitionId:"transition-2"};
  const req={...changed,intentDigest:computeShadowIntentDigest(changed)};
  const auth=s.gate.issueSyntheticAuthority(req);
  const proof=s.gate.issueSyntheticProof(req);
  const result=evaluate(s,{req,auth,proof});
  assert.equal(result.status,"DENY");
  assert.equal(result.reason,"IDEMPOTENCY_CONFLICT");
});

test("H-15: caller cannot downgrade mandatory P3 to P0", () => {
  const s=scenario();
  const next={...s.req,requiredProof:"P0" as const};
  const req={...next,intentDigest:computeShadowIntentDigest(next)};
  const auth=s.gate.issueSyntheticAuthority(req);
  const proof=s.gate.issueSyntheticProof(req,{proofLevel:"P0",evidenceIds:[]});
  assert.equal(evaluate(s,{req,auth,proof}).status,"DENY");
});

test("H-16: old applyTransition is not exported by index or deep company-kernel module", () => {
  assert.equal(Object.hasOwn(publicKernel,"applyTransition"),false);
  assert.equal(Object.hasOwn(kernelModule,"applyTransition"),false);
  const s=scenario();
  const production={...s.req,mode:"PRODUCTION"} as unknown as ShadowTransitionRequest;
  const result=evaluate(s,{req:production});
  assert.equal(result.status,"DENY");
  assert.equal(result.productionWrite,false);
  const unexpected={...s.req, callerSaysAllowed: true} as unknown as ShadowTransitionRequest;
  assert.equal(evaluate(s,{req:unexpected}).status,"DENY");
});
