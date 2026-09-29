import { KernelInvariantError } from "./errors";

type IdempotencyStatus = "RESERVED" | "COMMITTED";

export class IdempotencyLedger {
  readonly #entries = new Map<string, IdempotencyStatus>();

  reserve(key: string): void {
    if (!key.trim()) {
      throw new KernelInvariantError("IDEMPOTENCY_KEY_REQUIRED");
    }

    if (this.#entries.has(key)) {
      throw new KernelInvariantError("DUPLICATE_SIDE_EFFECT_BLOCKED");
    }

    this.#entries.set(key, "RESERVED");
  }

  commit(key: string): void {
    if (this.#entries.get(key) !== "RESERVED") {
      throw new KernelInvariantError("IDEMPOTENCY_KEY_NOT_RESERVED");
    }

    this.#entries.set(key, "COMMITTED");
  }

  status(key: string): IdempotencyStatus | undefined {
    return this.#entries.get(key);
  }
}
