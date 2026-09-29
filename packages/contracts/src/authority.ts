import type { ActorRef, AuthorityLevel } from "./primitives";

export interface AuthorityLimits {
  maxSpend?: number;
  maxCount?: number;
  expiresAt?: string;
}

export interface AuthorityRequest {
  actor: ActorRef;
  action: string;
  requiredLevel: AuthorityLevel;
  grantedLevel: AuthorityLevel;
  policyId: string;
  policyAllows: boolean;
  limits?: AuthorityLimits;
}

export interface AuthorityReceipt extends AuthorityRequest {
  id: string;
  allowed: boolean;
  reason: string;
}
