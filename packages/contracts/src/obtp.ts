export const OBTP_PROTOCOL = "obtp" as const;
export const OBTP_VERSION = "0.1" as const;

export interface ObtpEnvelope<T = unknown> {
  protocol: typeof OBTP_PROTOCOL;
  version: string;
  type: string;
  tenantId: string;
  companyId: string;
  messageId: string;
  correlationId: string;
  payload: T;
}
