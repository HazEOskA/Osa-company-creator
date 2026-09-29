import { createHash } from "node:crypto";
import type { ArtifactRef } from "../../contracts/src/index";

export function artifactSha256(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

export function verifyArtifactIntegrity(content: string, artifact: ArtifactRef): boolean {
  return artifact.sha256 === artifactSha256(content) && artifact.size === content.length;
}
