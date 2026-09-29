import {
  PROOF_LEVELS,
  type ProofLevel,
  type ProofRequirement,
} from "../../contracts/src/index";

function rank(level: ProofLevel): number {
  return PROOF_LEVELS.indexOf(level);
}

export function evaluateProof(requirement: ProofRequirement): {
  passed: boolean;
  achievedLevel: ProofLevel;
  reason: string;
} {
  const passing = requirement.verifications.filter((item) => item.result === "PASS");
  const achieved = passing.reduce<ProofLevel>(
    (current, receipt) => (rank(receipt.proofLevel) > rank(current) ? receipt.proofLevel : current),
    "P0",
  );

  if (rank(requirement.requiredLevel) > rank("P0") && requirement.evidence.length === 0) {
    return { passed: false, achievedLevel: achieved, reason: "No evidence supplied for a verified claim." };
  }

  if (requirement.verifications.some((item) => item.result === "FAIL")) {
    return { passed: false, achievedLevel: achieved, reason: "At least one verification failed." };
  }

  if (rank(achieved) < rank(requirement.requiredLevel)) {
    return {
      passed: false,
      achievedLevel: achieved,
      reason: `Required proof ${requirement.requiredLevel}; achieved ${achieved}.`,
    };
  }

  return { passed: true, achievedLevel: achieved, reason: "Required proof satisfied." };
}
