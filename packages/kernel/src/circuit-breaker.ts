import type {
  CircuitBreakerConfig,
  CircuitBreakerState,
} from "../../contracts/src/index";
import { KernelInvariantError } from "./errors";

export class CircuitBreaker {
  #state: CircuitBreakerState = "CLOSED";
  #failures = 0;

  constructor(readonly config: CircuitBreakerConfig) {
    if (config.failureThreshold < 1) {
      throw new KernelInvariantError("INVALID_CIRCUIT_BREAKER_THRESHOLD");
    }
  }

  get state(): CircuitBreakerState {
    return this.#state;
  }

  allowRequest(): boolean {
    return this.#state === "CLOSED";
  }

  recordSuccess(): void {
    this.#failures = 0;
  }

  recordFailure(): void {
    this.#failures += 1;
    if (this.#failures >= this.config.failureThreshold) {
      this.#state = "OPEN";
    }
  }

  reset(): void {
    this.#failures = 0;
    this.#state = "CLOSED";
  }
}
