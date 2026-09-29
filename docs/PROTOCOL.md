# Business Transition Protocol

A business state transition is the only legal mechanism for advancing production company state.

## Transition equation

```text
CURRENT STATE
+ PROPOSED MUTATION
+ AUTHORITY RECEIPT
+ EVIDENCE
+ VERIFICATION
= ACCEPTED OR REJECTED TRANSITION
```

## Proof levels

| Level | Meaning |
| --- | --- |
| P0 | Claim only |
| P1 | Execution evidence |
| P2 | Structural proof |
| P3 | Deterministic proof |
| P4 | Semantic proof |
| P5 | Real-world signal |
| P6 | Economic proof |

A transition declares its minimum required proof level before execution. The runtime may exceed the requirement, but it may not silently lower it.

## Authority levels

| Level | Meaning |
| --- | --- |
| A0 | Read |
| A1 | Propose |
| A2 | Internal execution |
| A3 | Reversible external action |
| A4 | Limited external action |
| A5 | Bounded economic action |
| A6 | Charter-bound autonomy |

A6 is not root access. It means the actor may operate autonomously only inside the enforceable company charter and policy set.

## State hashing

Every accepted state is canonically serialized and SHA-256 hashed. The next transition references the exact parent state hash. This prevents silent state drift and creates a replayable causal chain without requiring a blockchain.
