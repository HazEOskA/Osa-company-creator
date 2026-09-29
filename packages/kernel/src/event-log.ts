import type { CompanyEvent } from "../../contracts/src/index";

export class InMemoryEventLog {
  readonly #events: CompanyEvent[] = [];

  append<T>(event: CompanyEvent<T>): void {
    this.#events.push(Object.freeze({ ...event }));
  }

  all(): readonly CompanyEvent[] {
    return this.#events.map((event) => ({ ...event }));
  }

  reduce<T>(initial: T, reducer: (state: T, event: CompanyEvent) => T): T {
    return this.#events.reduce(reducer, initial);
  }
}
