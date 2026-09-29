# ADR-0001: Proof-native state transitions

## Status
Accepted

## Decision
Production company state may only advance through a Business Transition Protocol receipt that proves:

1. the proposal references the current parent state,
2. authority is granted,
3. evidence exists for verified claims,
4. the required proof threshold is satisfied.

## Consequence
LLM output is treated as a proposal, never as authoritative state. This raises implementation cost but makes the runtime auditable, replayable and suitable for higher-trust automation.
