# OBTP - Open Business Transition Protocol

## Purpose

OBTP defines how autonomous work becomes an authorized, evidence-backed and verifiable change in company state.

It is transport-neutral and provider-neutral.

## Envelope

Every protocol message carries:

- protocol = obtp
- explicit protocol version
- message type
- tenantId
- companyId
- messageId
- correlationId
- payload

Example:

~~~json
{
  "protocol": "obtp",
  "version": "0.1",
  "type": "business.transition",
  "tenantId": "TENANT-A",
  "companyId": "COMPANY-1",
  "messageId": "MSG-1",
  "correlationId": "CORR-1",
  "payload": {}
}
~~~

## Protocol layers

~~~text
OBTP
 |- Identity
 |- Tenancy
 |- Authority
 |- Capability
 |- Execution
 |- Artifact
 |- Evidence
 |- Verification
 |- Economics
 |- Transition
~~~

## Business transition equation

~~~text
CURRENT STATE
+ PROPOSED MUTATION
+ AUTHORITY RECEIPT
+ EVIDENCE
+ VERIFICATION
= ACCEPTED OR REJECTED TRANSITION
~~~

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

A6 is not root access.

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

## Distributed execution

A WorkEnvelope carries tenant scope, company scope, execution identity, capability, authority receipt, required proof, input reference, deadline, idempotency key, attempt and work state.

Workers obtain time-limited leases with monotonically increasing fencing generations. A stale generation cannot commit.

## Event semantics

Ordering is scoped per company stream, not globally.

Protocol events carry:

- tenantId
- companyId
- eventId
- eventType
- source
- causationId
- correlationId
- sequence
- occurredAt
- payloadHash
- payloadRef

## Relation to MCP and A2A

MCP and A2A can serve as execution transports or collaboration layers.

OBTP defines what business consequence that execution is allowed to cause and what evidence is required before company state advances.

## Versioning

OBTP uses semantic compatibility rules:

- MAJOR: breaking wire change
- MINOR: backwards-compatible capability
- PATCH: clarification or compatible fix
