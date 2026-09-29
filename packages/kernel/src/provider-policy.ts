import {
  AUTHORITY_LEVELS,
  type AuthorityLevel,
  type ProviderTrustProfile,
  type TenantContext,
} from "../../contracts/src/index";

function authorityRank(level: AuthorityLevel): number {
  return AUTHORITY_LEVELS.indexOf(level);
}

export function evaluateProviderTrust(
  profile: ProviderTrustProfile,
  context: TenantContext,
  requiredAuthority: AuthorityLevel,
  requireZeroRetention = false,
): { allowed: boolean; reasons: readonly string[] } {
  const reasons: string[] = [];

  if (profile.status === "QUARANTINED") {
    reasons.push("PROVIDER_QUARANTINED");
  }

  if (!profile.allowedDataClasses.includes(context.dataClass)) {
    reasons.push("DATA_CLASS_NOT_ALLOWED");
  }

  if (context.region && !profile.allowedRegions.includes(context.region)) {
    reasons.push("REGION_NOT_ALLOWED");
  }

  if (authorityRank(profile.maxAuthorityLevel) < authorityRank(requiredAuthority)) {
    reasons.push("AUTHORITY_CEILING_EXCEEDED");
  }

  if (requireZeroRetention && !profile.supportsZeroRetention) {
    reasons.push("ZERO_RETENTION_REQUIRED");
  }

  return { allowed: reasons.length === 0, reasons };
}
