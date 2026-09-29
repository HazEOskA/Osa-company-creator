# Osa Company Creator

**Proof-native, provider-neutral runtime for verifiable autonomous companies.**

Osa Company Creator is not another collection of AI employees. It is a control and verification kernel for closed-loop autonomous business systems.

The core rule is simple:

> **Company state advances only through authorized, evidence-backed and verified business transitions.**

## Architecture lock

V0.1–V0.3 currently define:

- Company IR and closed business loop
- Business Transition Protocol
- Authority Kernel (A0–A6)
- Proof Kernel (P0–P6)
- contextual Capability Router / League
- Economic Kernel
- immutable event history and causal replay foundation
- Shadow / Fork / Replay safety boundary
- champion/challenger learning model without direct production self-modification

```text
GOAL
  -> HYPOTHESIS
  -> EXPERIMENT
  -> AUTHORITY
  -> CAPABILITY
  -> EXECUTION
  -> EVIDENCE
  -> PROOF
  -> ECONOMIC OUTCOME
  -> STATE TRANSITION
  -> LEARNING / SHADOW
  -> NEXT DECISION
  -> LOOP
```

## Hard boundary

```text
LLM = UNTRUSTED PROPOSER
KERNEL = SOURCE OF ENFORCEMENT
```

Models may plan, generate and review. They do not grant themselves authority, lower proof requirements, or mutate production company state directly.

## Repository layout

```text
packages/
  contracts/   protocol and domain contracts
  kernel/      authority, proof, economics, routing, transitions, replay primitives
schemas/       machine-readable protocol schemas
docs/          architecture lock and ADRs
examples/      example company charter
```

## Verification

```bash
npm install
npm run check
```

The initial test harness verifies core invariants including authority gating, proof gating, state-hash transitions, contextual routing, economic verdicts, event replay and side-effect-free shadow forks.

## Status

Architecture foundation only. No production deployment is included in this bootstrap.
