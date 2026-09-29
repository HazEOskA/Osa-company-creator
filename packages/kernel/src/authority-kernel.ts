import {
  AUTHORITY_LEVELS,
  type AuthorityReceipt,
  type AuthorityRequest,
} from "../../contracts/src/index";

function rank(level: AuthorityRequest["requiredLevel"]): number {
  return AUTHORITY_LEVELS.indexOf(level);
}

export function evaluateAuthority(request: AuthorityRequest): AuthorityReceipt {
  const sufficientLevel = rank(request.grantedLevel) >= rank(request.requiredLevel);
  const allowed = request.policyAllows && sufficientLevel;

  return {
    ...request,
    id: `AUTH-${request.actor.id}-${request.action}`,
    allowed,
    reason: !request.policyAllows
      ? "Policy denied the requested action."
      : !sufficientLevel
        ? `Granted authority ${request.grantedLevel} is below required ${request.requiredLevel}.`
        : "Authority requirement satisfied.",
  };
}
