# Architecture Lock V0.1-V0.4

## Goal

Osa Company Creator is a provider-neutral, proof-native runtime for autonomous business systems.

The runtime does not trust a model, provider or worker to mutate company state directly. A production state change is legal only when it passes identity, tenancy, policy, authority, evidence, proof and transition gates.

## Closed loop

~~~text
GOAL
 -> HYPOTHESIS
 -> EXPERIMENT
 -> AUTHORITY
 -> TENANT / SECURITY POLICY
 -> CAPABILITY ROUTING
 -> DISTRIBUTED EXECUTION
 -> ARTIFACT
 -> EVIDENCE
 -> VERIFICATION
 -> ECONOMIC OUTCOME
 -> BUSINESS TRANSITION
 -> STATE COMMIT
 -> LEARNING / SHADOW
 -> NEXT DECISION
 -> LOOP
~~~

## Control plane

Owns:

- Company IR
- tenant and company scope
- policy and authority
- capability routing
- proof evaluation
- economic evaluation
- business transitions
- event causality
- shadow/fork/replay policy
- SRE safety controls

## Execution plane

Owns:

- workers
- provider adapters
- MCP/API/browser/build execution
- artifact production
- evidence production

The execution plane cannot advance company state.

## Trust boundary

~~~text
LLM = UNTRUSTED PROPOSER
WORKER = UNTRUSTED EXECUTOR
PROVIDER = UNTRUSTED DEPENDENCY
KERNEL = SOURCE OF ENFORCEMENT
~~~

## Identity and tenancy

Every execution is bound to:

- tenantId
- companyId
- executionId
- actorId
- explicit capabilities
- expiration time

Every production resource is tenant-owned. Raw private tenant context must never be reused across tenant boundaries.

## Secrets

Secret material is never a Company State field, event payload, proof receipt or model-memory field.

The runtime stores references such as:

~~~text
secret://TENANT-A/google-labs-token
~~~

Execution-time secret access must be tenant-scoped and capability-scoped.

## Distributed runtime

Work follows the state machine:

~~~text
CREATED
 -> AUTHORIZED
 -> QUEUED
 -> LEASED
 -> RUNNING
 -> EVIDENCE_PENDING
 -> VERIFYING
 -> VERIFIED
 -> TRANSITION_PENDING
 -> COMMITTED
~~~

Failure states include RETRYABLE_FAILURE, BLOCKED, QUARANTINED and DEAD_LETTER.

Delivery may be at-least-once. Safety is achieved through idempotency keys, leases, fencing generations and transition deduplication rather than pretending every external system supports exactly-once delivery.

## Event delivery

Committed state and its event publication intent belong to one logical transaction boundary. The outbox model prevents a committed state transition from being silently lost because event publication failed.

## Provider trust

Provider routing is constrained by:

- data classification
- region
- authority ceiling
- trust status
- retention requirements

Provider failure is not company failure. Routing may switch providers without redefining company strategy or state semantics.

## Artifact integrity

Artifacts are addressed by metadata including SHA-256, tenant and execution identity. Tampering can be detected independently of provider claims.

## SRE

Runtime safety signals include:

- latency
- traffic
- errors
- saturation
- verification pass rate
- transition rejection rate
- authority denial rate
- provider failover rate
- retry rate
- dead-letter count
- cost per verified transition

Circuit breakers override agent intent.

## Open protocol

OBTP - Open Business Transition Protocol - is the provider- and transport-neutral wire layer.

OBTP does not define which model, cloud, queue or database must be used. It defines the semantics required for autonomous work to become an authorized and verifiable business transition.

## Hard invariants

1. NO AUTHORITY -> NO EXECUTION.
2. NO EVIDENCE -> NO VERIFIED CLAIM.
3. NO REQUIRED PROOF -> NO SUCCESS.
4. NO VALID TRANSITION -> NO STATE MUTATION.
5. PROVIDER != CORE.
6. LLM != SOURCE OF TRUTH.
7. EXECUTION SUCCESS != BUSINESS SUCCESS.
8. NO TENANT CONTEXT -> NO EXECUTION.
9. TENANT A DATA MUST NEVER ENTER TENANT B CONTEXT.
10. SECRET MATERIAL MUST NOT ENTER PROMPTS, LOGS OR BUSINESS EVENTS.
11. EXTERNAL MUTATIONS REQUIRE IDEMPOTENCY IDENTITY.
12. STALE LEASES MAY NOT COMMIT RESULTS.
13. WORKER CLAIM != VERIFIED RESULT.
14. OBSERVABILITY LOG != EVIDENCE.
15. ONLY THE TRANSITION SERVICE MAY ADVANCE COMPANY STATE.
16. PROVIDER FAILURE MUST NOT CORRUPT COMPANY STATE.
17. PROTOCOL VERSION MUST BE EXPLICIT.
18. WIRE CONTRACTS MUST BE PROVIDER-NEUTRAL.
