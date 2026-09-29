# ADR-0004: At-least-once delivery with idempotency and fencing

## Status
Accepted

## Decision
The runtime assumes distributed work may be delivered more than once. External mutations require idempotency keys. Workers use expiring leases with fencing generations.

## Consequence
The system avoids relying on a false universal exactly-once guarantee while still preventing duplicate side effects and stale-worker commits.
