# P0.4-D.2 — Trusted Transition Gate (SHADOW ONLY)

## Source and permission boundary

- TARGET: `HazEOskA/Osa-company-creator`
- BASE_SHA: `8c6dbb4899049223420e5679685863ffe75e7b7a`
- Branch: `fix/p0-4-d2-trusted-transition-gate`
- Scope: native Company Creator contracts, kernel, native tests and Node type shims
- Other repos, real APIs, CI, merge and deployment: **NOT TOUCHED**
- Mode: **OFFLINE / SHADOW_ONLY**; there is no production commit API

## What was closed

1. Removed exported `applyTransition(current, BusinessTransitionProposal)` from both the barrel and the direct `company-kernel` module. The old API accepted arbitrary `authority.allowed` and `VerificationReceipt.result` claims.
2. Added `OfflineShadowTransitionGate.evaluate(...)` with explicit tenant, organization, company and project scope, policy, actor/action allowlist, A-level, P-level, digest, expiry, CAS and replay checks.
3. Added separate synthetic HMAC fixture attestation domains for authority and proof, with issuer pinning and signature comparison. Both fixture issuers are for tests **only**. These signatures are **not** production trust anchors.
4. Enforced `result=PASS` only if every proof check is present and passes, with evidence, matching subject, binding and intent.
5. Preserved `createInitialState()` but removed the old direct transition API. New results are `SHADOW_ONLY`, include `productionWrite=false`, and never call persistence, network or provider APIs.
6. All fixture-only idempotency state is held in an isolated memory map; cached results are cloned to prevent client mutation.
7. `evaluateProof()` was also tightened for mismatched individual checks. It **still does not authenticate external receipt origin** and must not be used as a production trust gate.

## Canonical contract and trust

The new `ShadowTransitionRequest` is versioned `osa.creator.shadow-transition.v1` and includes:
- `scope` with explicit tenant/organization/company/project IDs
- `actor`, `action`, `bindingDigest`, `policyDigest`
- `requestedAuthorityLevel`, `requiredProof`
- `fromStateHash`, `expectedVersion`, `idempotencyKey`
- `mutation`, `mutationDigest`, `intentDigest`

The trusted policy/scope are constructor fixtures for isolated tests. The request **cannot** override the policy minimum proof or authority level.

The authority attestation is bound to issuer, actor, scope, intent digest, binding digest, policy digest, expiry and granted level. The proof attestation is bound to issuer, intent, binding, mutation subject, checks and evidence. HMAC keys are ephemeral synthetic fixtures; no production keys, certificates or cloud resources are involved.

The candidate state hash uses the original Company Creator `sha256({companyId,version,data})` semantics. Current-state consistency and `expectedVersion` are checked before any shadow candidate is generated.

**Caveat:** a caller able to instantiate `OfflineShadowTransitionGate` can also issue its own *synthetic* attestations; this is acceptable ONLY because the resulting execution mode is hardcoded to `SHADOW_ONLY` and there is no side-effecting transition function. It is not a security boundary for production.

## Test matrix

| Test | Acceptance |
|---|---|
| H-01 | Valid synthetic scope/authority/proof/CAS yields a shadow candidate |
| H-02 | Signed `policyAllows=false` => DENY |
| H-03 | Granted A0 below required A6 => DENY |
| H-04 | Foreign issuer or altered signed decision => UNKNOWN/DENY |
| H-05 | Expired or premature authority => DENY |
| H-06 | Mutation or policy changes after approval => DENY |
| H-07 | PASS with any failed check => DENY, including direct `evaluateProof()` |
| H-08 | Missing/foreign proof issuer => UNKNOWN |
| H-09 | Changed proof subject, binding or intent => DENY |
| H-10 | Foreign tenant/company => DENY |
| H-11 | Foreign project => DENY |
| H-12 | Stale `fromStateHash` => DENY |
| H-13 | Stale `expectedVersion` / inconsistent state => DENY |
| H-14 | Conflicting replay => DENY; returned result cannot poison cached replay |
| H-15 | Caller lowers P3 requirement to P0 => DENY |
| H-16 | Old exported `applyTransition` absent, PRODUCTION mode => DENY, unexpected field => DENY |

The original 19 native tests were migrated where needed; total native suite is expected to run **35 tests**.

## Compatibility notes and GO/NO-GO

- **BREAKING API CHANGE:** any prior callers of `applyTransition` must migrate and pass full security regression tests. The old symbol is unavailable even on the direct module path.
- `BusinessTransitionProposal` is retained solely as a legacy *data type*, not an executable transition interface.
- All tests operate offline; no approval to modify Company OS adapter, Hydra, Gate Zero, RuntimeV2, OSA Proof, NeurOSA or Ratio Essendi was granted.
- This change does not provide durable distributed transaction guarantees or a real key management system.
- Next stage, with separate approval, must define independent trust anchor, authenticated service-to-service boundaries, durable idempotency, atomic persistence/outbox and externally verifiable provenance.

**GO:** isolated SHADOW contract tests after passing the suite.
**NO-GO:** production transitions or live integrations.
