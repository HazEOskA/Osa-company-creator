# ADR-0003: Tenant isolation is a kernel invariant

## Status
Accepted

## Decision
Every production execution and resource must carry tenantId and companyId. The kernel rejects cross-tenant ownership mismatches before execution or state mutation.

## Consequence
Shared learning may use safe aggregate metrics, but raw private tenant context cannot be silently reused by another tenant.
