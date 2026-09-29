# SRE Model V0.4

## Golden signals

- latency
- traffic
- errors
- saturation

## Runtime-specific signals

- verification pass rate
- transition rejection rate
- authority denial rate
- economic pass rate
- provider failover rate
- retry rate
- dead-letter count
- proof-level distribution
- cost per verified transition

## Safety SLOs

Design targets:

- unauthorized transition acceptance: 0
- cross-tenant leakage events: 0
- lost committed transitions: 0
- deterministic replay divergence: 0

Availability targets remain deployment-specific until a production topology exists.

## Circuit breakers

Circuit breakers are kernel safety controls, not model suggestions. Once open, routing must not send new work through the affected boundary until the breaker is reset by policy.

## Outbox

Event publication may fail independently of state persistence. The outbox pattern keeps publication intent durable until acknowledged.

## Dead-letter handling

Work that exhausts retry budget or violates protocol constraints must become inspectable dead-letter state with its causal and evidence history preserved.
