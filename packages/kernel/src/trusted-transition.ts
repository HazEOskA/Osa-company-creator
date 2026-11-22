import { createHmac, timingSafeEqual } from "node:crypto";
import type { ActorRef, AuthorityLevel, ProofLevel } from "../../contracts/src/primitives";
import { AUTHORITY_LEVELS, PROOF_LEVELS } from "../../contracts/src/primitives";
import type { CompanyState } from "../../contracts/src/company-ir";
import type { ShadowTransitionRequest, TrustedTransitionScope } from "../../contracts/src/transition";
import { canonicalJson, sha256 } from "./canonical";

/**
 * P0.4-D.2: strictly isolated shadow kernel.
 * No persistence, network, provider calls or production authority.
 *
 * Fixture issuer methods exist ONLY to build offline tests. They are NOT
 * production trust anchors, and cannot authorize a production transition.
 */
export interface ShadowFixturePolicy {
  policyId: string;
  policyDigest: string;
  requiredAuthorityLevel: AuthorityLevel;
  minimumProofLevel: ProofLevel;
  allowedActions: readonly string[];
  allowedActorIds: readonly string[];
}
export interface ShadowFixtureTrust {
  scope: TrustedTransitionScope;
  policy: ShadowFixturePolicy;
  authorityIssuerId: string;
  proofIssuerId: string;
  authorityTestKey: string;
  proofTestKey: string;
}
interface SignedAuthorityBody {
  kind: "SYNTHETIC_AUTHORITY_V1";
  issuerId: string;
  decisionId: string;
  scope: TrustedTransitionScope;
  actorId: string;
  intentDigest: string;
  bindingDigest: string;
  policyDigest: string;
  decision: "ALLOW" | "DENY" | "UNKNOWN";
  policyAllows: boolean;
  grantedLevel: AuthorityLevel;
  issuedAt: string;
  expiresAt: string;
}
export type SyntheticAuthorityAttestation = SignedAuthorityBody & { signature: string };
interface SignedProofBody {
  kind: "SYNTHETIC_PROOF_V1";
  issuerId: string;
  proofId: string;
  scope: TrustedTransitionScope;
  intentDigest: string;
  bindingDigest: string;
  subjectDigest: string;
  proofLevel: ProofLevel;
  result: "PASS" | "FAIL" | "INCONCLUSIVE";
  checks: readonly { id: string; passed: boolean }[];
  evidenceIds: readonly string[];
}
export type SyntheticProofAttestation = SignedProofBody & { signature: string };
export type ShadowGateStatus = "SIMULATED" | "DENY" | "UNKNOWN";
export type ShadowGateResult =
  | { status: "SIMULATED"; reason: "SHADOW_ONLY"; productionWrite: false;
      shadowState: CompanyState;
      receipt: {
        transitionId: string; fromStateHash: string; toStateHash: string;
        authorityDecisionId: string; proofId: string; mode: "SHADOW_ONLY";
      }; }
  | { status: "DENY" | "UNKNOWN"; reason: string; productionWrite: false };

function reject(reason: string): ShadowGateResult {
  return { status: "DENY", reason, productionWrite: false };
}
function unknown(reason: string): ShadowGateResult {
  return { status: "UNKNOWN", reason, productionWrite: false };
}
function rank(value: string, levels: readonly string[]): number {
  return levels.indexOf(value);
}
function exactKeys(value: unknown, keys: readonly string[]): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const found = Object.keys(value);
  return found.length === keys.length && found.every(k => keys.includes(k));
}
function isValidId(s: unknown): s is string {
  return typeof s === "string" && /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/.test(s);
}
function jsonSafe(value: unknown, seen = new WeakSet<object>()): boolean {
  if (value === null || typeof value === "boolean" || typeof value === "string") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value !== "object" || seen.has(value)) return false;
  if (Object.getPrototypeOf(value) !== Object.prototype &&
      Object.getPrototypeOf(value) !== null && !Array.isArray(value)) return false;
  seen.add(value);
  const result = Array.isArray(value)
    ? value.every(v => jsonSafe(v, seen))
    : Object.entries(value).every(([k, v]) =>
      !["__proto__", "constructor", "prototype"].includes(k) && jsonSafe(v, seen));
  seen.delete(value);
  return result;
}
function sameScope(a: TrustedTransitionScope, b: TrustedTransitionScope): boolean {
  return a.tenantId === b.tenantId && a.organizationId === b.organizationId &&
    a.companyId === b.companyId && a.projectId === b.projectId;
}
function hmac(domain: string, body: unknown, key: string): string {
  return createHmac("sha256", key)
    .update(canonicalJson({ schema: "osa.creator.synthetic-hmac.v1", domain, body }))
    .digest("hex");
}
function equalSignature(expected: string, received: string): boolean {
  if (!/^[0-9a-f]{64}$/.test(received)) return false;
  return timingSafeEqual(Uint8Array.from(expected.match(/../g) ?? [], x => parseInt(x, 16)), Uint8Array.from(received.match(/../g) ?? [], x => parseInt(x, 16)));
}
function authorityBody(a: SyntheticAuthorityAttestation): SignedAuthorityBody {
  return {
    kind: a.kind, issuerId: a.issuerId, decisionId: a.decisionId,
    scope: a.scope, actorId: a.actorId, intentDigest: a.intentDigest,
    bindingDigest: a.bindingDigest, policyDigest: a.policyDigest,
    decision: a.decision, policyAllows: a.policyAllows,
    grantedLevel: a.grantedLevel, issuedAt: a.issuedAt, expiresAt: a.expiresAt,
  };
}
function proofBody(p: SyntheticProofAttestation): SignedProofBody {
  return {
    kind: p.kind, issuerId: p.issuerId, proofId: p.proofId, scope: p.scope,
    intentDigest: p.intentDigest, bindingDigest: p.bindingDigest,
    subjectDigest: p.subjectDigest, proofLevel: p.proofLevel,
    result: p.result, checks: p.checks, evidenceIds: p.evidenceIds,
  };
}
const SCOPE_KEYS = ["tenantId","organizationId","companyId","projectId"] as const;
const ACTOR_KEYS = ["id","type"] as const;
const REQUEST_KEYS = ["schema","mode","transitionId","scope","actor","action",
  "bindingDigest","policyDigest","requestedAuthorityLevel","requiredProof",
  "fromStateHash","expectedVersion","idempotencyKey","mutation",
  "mutationDigest","intentDigest"] as const;const AUTH_KEYS = ["kind","issuerId","decisionId","scope","actorId","intentDigest",
  "bindingDigest","policyDigest","decision","policyAllows","grantedLevel",
  "issuedAt","expiresAt","signature"] as const;
const PROOF_KEYS = ["kind","issuerId","proofId","scope","intentDigest","bindingDigest",
  "subjectDigest","proofLevel","result","checks","evidenceIds","signature"] as const;
export function computeShadowMutationDigest(input: Pick<ShadowTransitionRequest,
  "scope" | "mutation">): string {
  if (!exactKeys(input.mutation, ["set"]) || !jsonSafe(input.mutation.set) ||
      !input.mutation.set || typeof input.mutation.set !== "object" ||
      Array.isArray(input.mutation.set) || Object.keys(input.mutation.set).length === 0) {
    throw new Error("INVALID_SHADOW_MUTATION");
  }
  return sha256({ domain: "osa.creator.shadow-mutation.v1",
    scope: input.scope, mutation: input.mutation });
}
export function computeShadowIntentDigest(req: Omit<ShadowTransitionRequest, "intentDigest">): string {
  return sha256({ domain: "osa.creator.shadow-intent.v1",
    schema: req.schema, mode: req.mode, transitionId: req.transitionId,
    scope: req.scope, actor: req.actor, action: req.action,
    bindingDigest: req.bindingDigest, policyDigest: req.policyDigest,
    requestedAuthorityLevel: req.requestedAuthorityLevel, requiredProof: req.requiredProof,
    fromStateHash: req.fromStateHash, expectedVersion: req.expectedVersion,
    idempotencyKey: req.idempotencyKey, mutationDigest: req.mutationDigest });
}

/**
 * The only transition-related export allowed for this version is shadow evaluation.
 * Production transitions are intentionally not implemented.
 */
export class OfflineShadowTransitionGate {
  readonly mode = "SHADOW_ONLY" as const;
  readonly #scope: TrustedTransitionScope;
  readonly #policy: ShadowFixturePolicy;
  readonly #authorityIssuerId: string;
  readonly #proofIssuerId: string;
  readonly #authorityKey: string;
  readonly #proofKey: string;
  readonly #replays = new Map<string, { intentDigest: string; result: ShadowGateResult }>();

  constructor(fixture: ShadowFixtureTrust) {
    if (!fixture || !fixture.scope || !fixture.policy ||
        !exactKeys(fixture.scope, SCOPE_KEYS) ||
        !Object.values(fixture.scope).every(isValidId) ||
        !isValidId(fixture.policy.policyId) ||
        !/^[0-9a-f]{64}$/.test(fixture.policy.policyDigest) ||
        rank(fixture.policy.requiredAuthorityLevel, AUTHORITY_LEVELS) < 0 ||
        rank(fixture.policy.minimumProofLevel, PROOF_LEVELS) < 1 ||
        !fixture.policy.allowedActions.every(isValidId) ||
        !fixture.policy.allowedActorIds.every(isValidId) ||
        !isValidId(fixture.authorityIssuerId) || !isValidId(fixture.proofIssuerId) ||
        fixture.authorityTestKey.length < 16 || fixture.proofTestKey.length < 16) {
      throw new Error("INVALID_SYNTHETIC_TRUST_FIXTURE");
    }
    this.#scope = structuredClone(fixture.scope);
    this.#policy = structuredClone(fixture.policy);
    this.#authorityIssuerId = fixture.authorityIssuerId;
    this.#proofIssuerId = fixture.proofIssuerId;
    this.#authorityKey = fixture.authorityTestKey;
    this.#proofKey = fixture.proofTestKey;
  }

  /** Fixture-only issuer; never use its output as production evidence. */
  issueSyntheticAuthority(req: ShadowTransitionRequest,
    overrides: Partial<SignedAuthorityBody> = {}): SyntheticAuthorityAttestation {
    const body: SignedAuthorityBody = {
      kind: "SYNTHETIC_AUTHORITY_V1",
      issuerId: this.#authorityIssuerId, decisionId: "fake-authority-" + req.transitionId,
      scope: structuredClone(req.scope), actorId: req.actor.id,
      intentDigest: req.intentDigest, bindingDigest: req.bindingDigest,
      policyDigest: req.policyDigest, decision: "ALLOW", policyAllows: true,
      grantedLevel: this.#policy.requiredAuthorityLevel,
      issuedAt: "2026-11-22T09:00:00Z", expiresAt: "2030-01-01T00:00:00Z",
      ...overrides,
    };
    return { ...body, signature: hmac("authority", body, this.#authorityKey) };
  }
  /** Fixture-only issuer; never use its output as production evidence. */
  issueSyntheticProof(req: ShadowTransitionRequest,
    overrides: Partial<SignedProofBody> = {}): SyntheticProofAttestation {
    const body: SignedProofBody = {
      kind: "SYNTHETIC_PROOF_V1",
      issuerId: this.#proofIssuerId, proofId: "fake-proof-" + req.transitionId,
      scope: structuredClone(req.scope), intentDigest: req.intentDigest,
      bindingDigest: req.bindingDigest, subjectDigest: req.mutationDigest,
      proofLevel: this.#policy.minimumProofLevel, result: "PASS",
      checks: [{ id: "offline-fixture-check", passed: true }],
      evidenceIds: ["fixture-evidence-" + req.transitionId],
      ...overrides,
    };
    return { ...body, signature: hmac("proof", body, this.#proofKey) };
  }

  evaluate(current: CompanyState, req: ShadowTransitionRequest,
    authority: SyntheticAuthorityAttestation | null,
    proof: SyntheticProofAttestation | null, nowIso: string): ShadowGateResult {
    // The following gate never calls a production side-effect and cannot return
    // a production-committable state or receipt.
    if (!exactKeys(req, REQUEST_KEYS) || req.mode !== "SHADOW_ONLY" ||
        req.schema !== "osa.creator.shadow-transition.v1") return reject("PRODUCTION_FORBIDDEN");
    if (!exactKeys(req.scope, SCOPE_KEYS) ||
        !sameScope(req.scope, this.#scope) ||
        current.companyId !== this.#scope.companyId) return reject("SCOPE_MISMATCH");
    if (!Object.values(req.scope).every(isValidId) ||
        !exactKeys(req.actor, ACTOR_KEYS) ||
        !isValidId(req.transitionId) || !isValidId(req.actor?.id) ||
        !["human","agent","service"].includes(req.actor.type) ||
        !isValidId(req.action) || !isValidId(req.idempotencyKey) ||
        !/^[0-9a-f]{64}$/.test(req.bindingDigest) ||
        !/^[0-9a-f]{64}$/.test(req.fromStateHash) ||
        !/^[0-9a-f]{64}$/.test(req.intentDigest) ||
        !/^[0-9a-f]{64}$/.test(req.mutationDigest) ||
        !Number.isSafeInteger(req.expectedVersion) || req.expectedVersion < 0 ||
        !jsonSafe(current.data)) return reject("INVALID_TRANSITION_INPUT");
    if (req.policyDigest !== this.#policy.policyDigest ||
        !this.#policy.allowedActions.includes(req.action) ||
        !this.#policy.allowedActorIds.includes(req.actor.id) ||
        rank(req.requestedAuthorityLevel, AUTHORITY_LEVELS) <
          rank(this.#policy.requiredAuthorityLevel, AUTHORITY_LEVELS) ||
        rank(req.requiredProof, PROOF_LEVELS) <
          rank(this.#policy.minimumProofLevel, PROOF_LEVELS)) return reject("POLICY_DENIED");
    if (req.expectedVersion !== current.version ||
        req.fromStateHash !== current.stateHash ||
        current.stateHash !== sha256({
          companyId: current.companyId, version: current.version, data: current.data,
        })) return reject("STATE_CAS_MISMATCH");
    try {
      if (req.mutationDigest !== computeShadowMutationDigest(req) ||
          req.intentDigest !== computeShadowIntentDigest(req)) return reject("INTENT_DIGEST_MISMATCH");
    } catch {
      return reject("INVALID_MUTATION");
    }
    if (!authority) return unknown("AUTHORITY_MISSING");
    if (!exactKeys(authority, AUTH_KEYS) ||
        authority.kind !== "SYNTHETIC_AUTHORITY_V1" ||
        authority.issuerId !== this.#authorityIssuerId) return unknown("AUTHORITY_ISSUER_UNKNOWN");
    if (!equalSignature(hmac("authority", authorityBody(authority),
          this.#authorityKey), authority.signature)) return reject("AUTHORITY_SIGNATURE_INVALID");
    if (!exactKeys(authority.scope, SCOPE_KEYS) ||
        !sameScope(authority.scope, this.#scope) ||
        authority.actorId !== req.actor.id || authority.intentDigest !== req.intentDigest ||
        authority.bindingDigest !== req.bindingDigest ||
        authority.policyDigest !== this.#policy.policyDigest ||
        authority.decision !== "ALLOW" || authority.policyAllows !== true ||
        rank(authority.grantedLevel, AUTHORITY_LEVELS) <
          rank(req.requestedAuthorityLevel, AUTHORITY_LEVELS) ||
        rank(authority.grantedLevel, AUTHORITY_LEVELS) <
          rank(this.#policy.requiredAuthorityLevel, AUTHORITY_LEVELS)) return reject("AUTHORITY_DENIED");
    const now = Date.parse(nowIso);
    if (!Number.isFinite(now) || !Number.isFinite(Date.parse(authority.expiresAt)) ||
        !Number.isFinite(Date.parse(authority.issuedAt)) ||
        now >= Date.parse(authority.expiresAt) || now < Date.parse(authority.issuedAt))
      return reject("AUTHORITY_EXPIRED_OR_INVALID");
    if (!proof) return unknown("PROOF_MISSING");
    if (!exactKeys(proof, PROOF_KEYS) || proof.kind !== "SYNTHETIC_PROOF_V1" ||
        proof.issuerId !== this.#proofIssuerId) return unknown("PROOF_ISSUER_UNKNOWN");
    if (!equalSignature(hmac("proof", proofBody(proof),
          this.#proofKey), proof.signature)) return reject("PROOF_SIGNATURE_INVALID");
    if (!exactKeys(proof.scope, SCOPE_KEYS) ||
        !sameScope(proof.scope, this.#scope) ||
        proof.intentDigest !== req.intentDigest ||
        proof.bindingDigest !== req.bindingDigest ||
        proof.subjectDigest !== req.mutationDigest ||
        proof.result !== "PASS" ||
        rank(proof.proofLevel, PROOF_LEVELS) < rank(req.requiredProof, PROOF_LEVELS) ||
        rank(proof.proofLevel, PROOF_LEVELS) < rank(this.#policy.minimumProofLevel, PROOF_LEVELS) ||
        !Array.isArray(proof.checks) || proof.checks.length === 0 ||
        proof.checks.some(check => !exactKeys(check, ["id","passed"]) ||
          !isValidId(check.id) || check.passed !== true) ||
        !Array.isArray(proof.evidenceIds) || proof.evidenceIds.length === 0 ||
        proof.evidenceIds.some(ev => !isValidId(ev)))
      return reject("PROOF_DENIED");
    const scopeKey = canonicalJson([req.scope.tenantId,req.scope.companyId,req.idempotencyKey]);
    const previous = this.#replays.get(scopeKey);
    if (previous) return previous.intentDigest === req.intentDigest
      ? previous.result : reject("IDEMPOTENCY_CONFLICT");
    const nextVersion = current.version + 1;
    const nextData = structuredClone({ ...current.data, ...req.mutation.set });
    const nextHash = sha256({
      companyId: current.companyId, version: nextVersion, data: nextData,
    });
    const result: ShadowGateResult = {
      status: "SIMULATED", reason: "SHADOW_ONLY", productionWrite: false,
      shadowState: {
        companyId: current.companyId, version: nextVersion, data: nextData,
        stateHash: nextHash,
      },
      receipt: {
        transitionId: req.transitionId, fromStateHash: current.stateHash,
        toStateHash: nextHash,
        authorityDecisionId: authority.decisionId, proofId: proof.proofId,
        mode: "SHADOW_ONLY",
      },
    };
    this.#replays.set(scopeKey, { intentDigest: req.intentDigest,
      result: structuredClone(result) });
    return result;
  }
}
