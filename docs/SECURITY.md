# Security Model V0.4

## Default posture

Everything is untrusted by default, including models, workers, providers, tools, webhooks and artifacts.

## Protected failure classes

- prompt injection
- cross-tenant access
- secret exfiltration
- forged evidence
- stale authorization
- provider compromise
- rogue or stale workers
- duplicate external side effects
- artifact tampering
- privilege escalation
- unbounded spend
- data poisoning

## Controls

### Tenant isolation

Every execution and production resource is bound to tenantId and companyId.

Cross-tenant mismatch is a hard kernel error.

### Execution identity

Execution identities are:

- tenant-bound
- company-bound
- capability-bound
- execution-bound
- time-bound

### Secrets

Secrets are represented by references. Secret material is redacted before diagnostic or protocol payloads are emitted.

### Provider trust

Provider eligibility is checked against data class, region, authority ceiling, trust state and optional zero-retention requirements.

### Idempotency

Every external mutation must have a stable idempotency identity. Reusing a committed identity is blocked.

### Leases and fencing

A worker may only act while holding an unexpired lease. Fencing generations prevent a stale worker from committing after a newer worker has taken ownership.

### Artifact integrity

Artifact hashes allow verification independent of a provider claim.

## Non-goal

V0.4 defines kernel primitives and protocol contracts. It does not claim complete cloud hardening, key management, network segmentation or compliance certification.
