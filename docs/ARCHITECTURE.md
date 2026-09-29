# Architecture Lock V0.1–V0.3

## Goal

Osa Company Creator is a provider-neutral, proof-native runtime for autonomous business systems. The core does not trust an LLM to mutate company state directly. Models may propose, plan, generate and review; the kernel owns authority, policy, evidence, proof and state transitions.

## Closed loop

```text
GOAL
  -> HYPOTHESIS
  -> EXPERIMENT
  -> AUTHORITY
  -> CAPABILITY ROUTING
  -> EXECUTION
  -> EVIDENCE
  -> VERIFICATION
  -> ECONOMIC OUTCOME
  -> BUSINESS TRANSITION
  -> LEARNING / SHADOW CHALLENGER
  -> NEXT DECISION
  -> LOOP
```

## Kernel boundaries

1. **Company IR** — canonical representation of charter, goals, state and proof requirements.
2. **Authority Kernel** — no execution or state mutation without explicit authority.
3. **Proof Kernel** — evidence and verification are required before a claim can advance state.
4. **Business Transition Protocol** — state changes only through validated transition receipts.
5. **Economic Kernel** — technical success is evaluated separately from business value.
6. **Capability Router / League** — providers are replaceable backends selected by contextual evidence.
7. **Immutable Event Log** — causal, replayable history of what happened.
8. **Shadow / Fork / Replay** — challengers are evaluated without contaminating production state.

## Trust boundary

```text
LLM = UNTRUSTED PROPOSER
KERNEL = SOURCE OF ENFORCEMENT
```

An LLM can recommend an action. It cannot grant itself authority, lower its required proof level, or directly overwrite production company state.

## Hard invariants

- I1: NO AUTHORITY -> NO EXECUTION.
- I2: NO EVIDENCE -> NO VERIFIED CLAIM.
- I3: NO REQUIRED PROOF -> NO SUCCESS.
- I4: NO VALID TRANSITION -> NO STATE MUTATION.
- I5: NO CAUSAL PARENT -> NO DECISION.
- I6: PROVIDER != CORE.
- I7: LLM != SOURCE OF TRUTH.
- I8: CLAIM != PROOF.
- I9: EXECUTION SUCCESS != BUSINESS SUCCESS.
- I10: CURRENT STATE MUST BE REPLAYABLE.
- I11: NO ECONOMIC CLAIM WITHOUT AN ECONOMIC RECEIPT.
- I12: NO CHALLENGER -> PRODUCTION WITHOUT A PROMOTION GATE.
- I13: LEARNING MAY NOT MODIFY PRODUCTION DIRECTLY.
- I14: PROMOTED REGRESSIONS BECOME REGRESSION CASES.
- I15: SHADOW FORKS HAVE NO EXTERNAL SIDE EFFECTS BY DEFAULT.
- I16: PROVIDER PERFORMANCE IS CONTEXTUAL, NOT GLOBAL.
- I17: CONFIDENCE != PROOF.
- I18: STALE EVIDENCE MUST NOT SILENTLY REPRESENT CURRENT REALITY.
- I19: CIRCUIT BREAKERS OVERRIDE AGENT INTENT.
- I20: PRODUCTION AND EXPERIMENTAL STATE MUST NEVER MIX.
