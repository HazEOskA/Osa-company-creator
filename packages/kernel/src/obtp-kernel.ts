import {
  OBTP_PROTOCOL,
  OBTP_VERSION,
  type ObtpEnvelope,
  type TenantContext,
} from "../../contracts/src/index";
import { KernelInvariantError } from "./errors";

export function createObtpEnvelope<T>(
  context: TenantContext,
  type: string,
  messageId: string,
  correlationId: string,
  payload: T,
): ObtpEnvelope<T> {
  return {
    protocol: OBTP_PROTOCOL,
    version: OBTP_VERSION,
    type,
    tenantId: context.tenantId,
    companyId: context.companyId,
    messageId,
    correlationId,
    payload,
  };
}

export function assertObtpEnvelope<T>(
  envelope: ObtpEnvelope<T>,
  context: TenantContext,
): void {
  if (envelope.protocol !== OBTP_PROTOCOL || envelope.version !== OBTP_VERSION) {
    throw new KernelInvariantError("OBTP_VERSION_OR_PROTOCOL_MISMATCH");
  }

  if (envelope.tenantId !== context.tenantId || envelope.companyId !== context.companyId) {
    throw new KernelInvariantError("OBTP_TENANT_SCOPE_VIOLATION");
  }

  if (!envelope.type || !envelope.messageId || !envelope.correlationId) {
    throw new KernelInvariantError("OBTP_REQUIRED_ENVELOPE_FIELD_MISSING");
  }
}
