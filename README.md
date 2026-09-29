# Osa Company Creator

**Proof-native, provider-neutral runtime for verifiable autonomous companies.**

Osa Company Creator is not another collection of AI employees. It is a control and verification kernel for closed-loop autonomous business systems.

The core rule is simple:

> **Company state advances only through authorized, evidence-backed and verified business transitions.**

## Architecture lock

V0.1-V0.4 define:

- Company IR and closed business loop
- Business Transition Protocol
- Authority Kernel (A0-A6)
- Proof Kernel (P0-P6)
- contextual Capability Router / League
- Economic Kernel
- immutable event history and causal replay foundation
- Shadow / Fork / Replay safety boundary
- champion/challenger learning model without direct production self-modification
- Security Kernel and tenant isolation
- tenant-scoped secret references and short-lived execution identities
- distributed work envelopes, leases and fencing tokens
- idempotency boundaries for external mutations
- outbox/event delivery foundation
- artifact integrity checks
- provider trust policy
- SRE circuit breakers and runtime health contracts
- OBTP: Open Business Transition Protocol

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
  -> PROOF
  -> ECONOMIC OUTCOME
  -> BUSINESS TRANSITION
  -> STATE COMMIT
  -> LEARNING / SHADOW
  -> NEXT DECISION
  -> LOOP
~~~

## Hard boundary

~~~text
LLM = UNTRUSTED PROPOSER
WORKER = UNTRUSTED EXECUTOR
KERNEL = SOURCE OF ENFORCEMENT
~~~

Models and workers may plan, generate, execute and review. They do not grant themselves authority, cross tenant boundaries, lower proof requirements, expose secrets, or mutate production company state directly.

## V0.4 security invariants

- tenant context is mandatory for execution
- cross-tenant access is rejected
- secrets are references, never business-state material
- execution identity is tenant-, capability- and time-bound
- external mutations require idempotency identity
- stale leases are fenced out
- provider trust is evaluated before routing
- logs are not evidence
- worker claims are not verified results
- only the transition service may advance company state
- protocol version is explicit
- wire contracts remain provider- and transport-neutral

## Repository layout

~~~text
packages/
  contracts/   protocol and domain contracts
  kernel/      authority, proof, economics, routing, tenancy, security and distributed primitives
schemas/       machine-readable OBTP-aligned protocol schemas
docs/          architecture lock, protocol, security, SRE and ADRs
examples/      example company charter
~~~

## Verification

~~~bash
npm install
npm run check
~~~

The test harness verifies proof/authority/state invariants together with tenant isolation, secret redaction, provider trust, idempotency, fencing, distributed state transitions, artifact integrity, OBTP envelopes, outbox behavior and circuit breaking.

## Protocol

The open wire layer is **OBTP - Open Business Transition Protocol**. OBTP defines the meaning of authority, capability execution, evidence, verification, economic outcome and business transitions without depending on a specific LLM, cloud, database, queue, MCP server or transport.

## Status

Architecture foundation only. No production deployment is included in this branch.
