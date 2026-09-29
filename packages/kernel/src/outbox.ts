import type { OutboxRecord, ProtocolEvent } from "../../contracts/src/index";
import { KernelInvariantError } from "./errors";

export class InMemoryOutbox {
  readonly #records = new Map<string, OutboxRecord>();

  enqueue(id: string, event: ProtocolEvent): void {
    if (this.#records.has(id)) {
      throw new KernelInvariantError("OUTBOX_DUPLICATE");
    }

    this.#records.set(id, { id, event });
  }

  pending(): readonly OutboxRecord[] {
    return [...this.#records.values()].filter((record) => !record.publishedAt);
  }

  markPublished(id: string, publishedAt: string): void {
    const record = this.#records.get(id);
    if (!record) {
      throw new KernelInvariantError("OUTBOX_RECORD_NOT_FOUND");
    }

    this.#records.set(id, { ...record, publishedAt });
  }
}
