import type { WorkLease } from "../../contracts/src/index";
import { KernelInvariantError } from "./errors";

export function createWorkLease(
  workId: string,
  workerId: string,
  generation: number,
  nowMs: number,
  ttlMs: number,
): WorkLease {
  if (generation < 1 || ttlMs <= 0) {
    throw new KernelInvariantError("INVALID_LEASE_PARAMETERS");
  }

  return {
    workId,
    workerId,
    generation,
    issuedAt: new Date(nowMs).toISOString(),
    expiresAt: new Date(nowMs + ttlMs).toISOString(),
  };
}

export function assertWorkLeaseActive(
  lease: WorkLease,
  expectedGeneration: number,
  nowMs: number,
): void {
  if (lease.generation !== expectedGeneration) {
    throw new KernelInvariantError("STALE_FENCING_TOKEN");
  }

  if (Date.parse(lease.expiresAt) <= nowMs) {
    throw new KernelInvariantError("LEASE_EXPIRED");
  }
}
