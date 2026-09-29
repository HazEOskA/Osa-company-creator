import type {
  ExecutionIdentity,
  TenantContext,
  TenantOwnedResource,
} from "../../contracts/src/index";
import { KernelInvariantError } from "./errors";

export function assertTenantOwnership(
  context: TenantContext,
  resource: TenantOwnedResource,
): void {
  if (context.tenantId !== resource.tenantId || context.companyId !== resource.companyId) {
    throw new KernelInvariantError("CROSS_TENANT_ACCESS_DENIED");
  }
}

export function assertExecutionIdentity(
  identity: ExecutionIdentity,
  context: TenantContext,
  requiredCapability: string,
  nowIso: string,
): void {
  assertTenantOwnership(context, identity);

  if (Date.parse(identity.expiresAt) <= Date.parse(nowIso)) {
    throw new KernelInvariantError("EXECUTION_IDENTITY_EXPIRED");
  }

  if (!identity.grantedCapabilities.includes(requiredCapability)) {
    throw new KernelInvariantError("EXECUTION_CAPABILITY_NOT_GRANTED");
  }
}
