import test from "node:test";
import assert from "node:assert/strict";
import type {
  ArtifactRef,
  ProviderTrustProfile,
  TenantContext,
  WorkEnvelope,
} from "../../contracts/src/index";
import {
  CircuitBreaker,
  IdempotencyLedger,
  InMemoryOutbox,
  advanceWorkState,
  artifactSha256,
  assertExecutionIdentity,
  assertObtpEnvelope,
  assertSecretRefScope,
  assertTenantOwnership,
  assertWorkLeaseActive,
  createObtpEnvelope,
  createSecretRef,
  createWorkLease,
  evaluateProviderTrust,
  redactSensitiveFields,
  verifyArtifactIntegrity,
} from "../src/index";

const context: TenantContext = {
  tenantId: "TENANT-A",
  companyId: "COMPANY-1",
  environment: "production",
  dataClass: "CONFIDENTIAL",
  region: "eu-west",
};

test("cross-tenant resource access is blocked", () => {
  assert.throws(
    () =>
      assertTenantOwnership(context, {
        tenantId: "TENANT-B",
        companyId: "COMPANY-1",
      }),
    /CROSS_TENANT_ACCESS_DENIED/,
  );
});

test("execution identity is tenant-bound, capability-bound and time-bound", () => {
  const identity = {
    tenantId: "TENANT-A",
    companyId: "COMPANY-1",
    actorId: "worker-1",
    executionId: "EXEC-1",
    role: "worker",
    grantedCapabilities: ["web_app_generation"],
    issuedAt: "2026-09-29T08:00:00Z",
    expiresAt: "2026-09-29T09:00:00Z",
  };

  assertExecutionIdentity(identity, context, "web_app_generation", "2026-09-29T08:30:00Z");
  assert.throws(
    () => assertExecutionIdentity(identity, context, "send_email", "2026-09-29T08:30:00Z"),
    /EXECUTION_CAPABILITY_NOT_GRANTED/,
  );
  assert.throws(
    () => assertExecutionIdentity(identity, context, "web_app_generation", "2026-09-29T09:00:00Z"),
    /EXECUTION_IDENTITY_EXPIRED/,
  );
});

test("secret references remain tenant-scoped and secret material is redacted", () => {
  const secret = createSecretRef(context, "google-labs-token");
  assertSecretRefScope(secret, context);
  assert.equal(secret.ref, "secret://TENANT-A/google-labs-token");

  const redacted = redactSensitiveFields({
    apiKey: "raw-key",
    nested: { token: "raw-token", safe: "keep" },
    reference: secret.ref,
  });

  assert.equal(redacted.apiKey, "[REDACTED]");
  assert.equal(redacted.nested.token, "[REDACTED]");
  assert.equal(redacted.nested.safe, "keep");
  assert.equal(redacted.reference, secret.ref);
});

test("provider trust policy enforces data, region, authority and retention boundaries", () => {
  const profile: ProviderTrustProfile = {
    providerId: "provider-a",
    allowedDataClasses: ["PUBLIC", "INTERNAL", "CONFIDENTIAL"],
    allowedRegions: ["eu-west"],
    supportsZeroRetention: true,
    maxAuthorityLevel: "A3",
    status: "TRUSTED",
  };

  assert.equal(evaluateProviderTrust(profile, context, "A3", true).allowed, true);

  const denied = evaluateProviderTrust(profile, context, "A4", true);
  assert.equal(denied.allowed, false);
  assert.ok(denied.reasons.includes("AUTHORITY_CEILING_EXCEEDED"));
});

test("duplicate external side-effect identity is blocked", () => {
  const ledger = new IdempotencyLedger();
  ledger.reserve("send-email:lead-7:offer-2");
  ledger.commit("send-email:lead-7:offer-2");

  assert.equal(ledger.status("send-email:lead-7:offer-2"), "COMMITTED");
  assert.throws(
    () => ledger.reserve("send-email:lead-7:offer-2"),
    /DUPLICATE_SIDE_EFFECT_BLOCKED/,
  );
});

test("lease generation acts as a fencing token and expired workers cannot commit", () => {
  const lease = createWorkLease("WORK-1", "worker-a", 4, 1_000, 500);

  assertWorkLeaseActive(lease, 4, 1_200);
  assert.throws(() => assertWorkLeaseActive(lease, 3, 1_200), /STALE_FENCING_TOKEN/);
  assert.throws(() => assertWorkLeaseActive(lease, 4, 1_500), /LEASE_EXPIRED/);
});

test("distributed work state machine rejects illegal jumps", () => {
  const work: WorkEnvelope = {
    protocolVersion: "obtp/0.1",
    workId: "WORK-1",
    tenantId: "TENANT-A",
    companyId: "COMPANY-1",
    executionId: "EXEC-1",
    capability: "research",
    authorityReceiptId: "AUTH-1",
    requiredProof: "P3",
    inputRef: "artifact://input",
    deadline: "2026-09-29T12:00:00Z",
    idempotencyKey: "WORK-1:attempt-1",
    attempt: 1,
    state: "CREATED",
  };

  const authorized = advanceWorkState(work, "AUTHORIZED");
  const queued = advanceWorkState(authorized, "QUEUED");

  assert.equal(queued.state, "QUEUED");
  assert.throws(() => advanceWorkState(queued, "COMMITTED"), /INVALID_WORK_STATE_TRANSITION/);
});

test("artifact integrity detects tampering", () => {
  const content = "artifact-v1";
  const artifact: ArtifactRef = {
    uri: "artifact://landing-v1",
    sha256: artifactSha256(content),
    size: content.length,
    mediaType: "text/plain",
    tenantId: "TENANT-A",
    executionId: "EXEC-1",
  };

  assert.equal(verifyArtifactIntegrity(content, artifact), true);
  assert.equal(verifyArtifactIntegrity("artifact-v2", artifact), false);
});

test("OBTP envelope requires explicit protocol version and tenant scope", () => {
  const envelope = createObtpEnvelope(
    context,
    "business.transition",
    "MSG-1",
    "CORR-1",
    { transitionId: "TR-1" },
  );

  assertObtpEnvelope(envelope, context);
  assert.equal(envelope.protocol, "obtp");
  assert.equal(envelope.version, "0.1");

  assert.throws(
    () => assertObtpEnvelope({ ...envelope, tenantId: "TENANT-B" }, context),
    /OBTP_TENANT_SCOPE_VIOLATION/,
  );
});

test("outbox preserves committed events until publication acknowledgement", () => {
  const outbox = new InMemoryOutbox();
  outbox.enqueue("OUT-1", {
    protocolVersion: "obtp/0.1",
    eventId: "EV-1",
    tenantId: "TENANT-A",
    companyId: "COMPANY-1",
    eventType: "StateAdvanced",
    source: "transition-service",
    correlationId: "CORR-1",
    sequence: 1,
    occurredAt: "2026-09-29T08:00:00Z",
    payloadHash: "abc",
    payloadRef: "artifact://events/EV-1",
  });

  assert.equal(outbox.pending().length, 1);
  outbox.markPublished("OUT-1", "2026-09-29T08:00:01Z");
  assert.equal(outbox.pending().length, 0);
});

test("circuit breaker overrides agent intent after repeated failures", () => {
  const breaker = new CircuitBreaker({ failureThreshold: 2 });

  assert.equal(breaker.allowRequest(), true);
  breaker.recordFailure();
  assert.equal(breaker.allowRequest(), true);
  breaker.recordFailure();
  assert.equal(breaker.state, "OPEN");
  assert.equal(breaker.allowRequest(), false);

  breaker.reset();
  assert.equal(breaker.state, "CLOSED");
});
