import type { AuthorityLevel } from "./primitives";
import type { DataClass } from "./tenancy";

export interface SecretRef {
  ref: string;
  tenantId: string;
  name: string;
}

export interface ExecutionIdentity {
  tenantId: string;
  companyId: string;
  actorId: string;
  executionId: string;
  role: string;
  grantedCapabilities: readonly string[];
  issuedAt: string;
  expiresAt: string;
}

export type ProviderStatus = "TRUSTED" | "RESTRICTED" | "QUARANTINED";

export interface ProviderTrustProfile {
  providerId: string;
  allowedDataClasses: readonly DataClass[];
  allowedRegions: readonly string[];
  supportsZeroRetention?: boolean;
  supportsPrivateNetworking?: boolean;
  maxAuthorityLevel: AuthorityLevel;
  status: ProviderStatus;
}

export interface ArtifactRef {
  uri: string;
  sha256: string;
  size: number;
  mediaType: string;
  tenantId: string;
  executionId: string;
}
