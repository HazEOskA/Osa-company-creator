import type { SecretRef, TenantContext } from "../../contracts/src/index";
import { KernelInvariantError } from "./errors";

const SENSITIVE_KEY = /(password|token|api[_-]?key|secretvalue|secret_value|credential)/i;

export function createSecretRef(context: TenantContext, name: string): SecretRef {
  if (!name.trim()) {
    throw new KernelInvariantError("SECRET_NAME_REQUIRED");
  }

  return {
    tenantId: context.tenantId,
    name,
    ref: "secret://" + context.tenantId + "/" + encodeURIComponent(name),
  };
}

export function assertSecretRefScope(ref: SecretRef, context: TenantContext): void {
  if (ref.tenantId !== context.tenantId || !ref.ref.startsWith("secret://" + context.tenantId + "/")) {
    throw new KernelInvariantError("SECRET_SCOPE_VIOLATION");
  }
}

function redactValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redactValue);
  }

  if (value !== null && typeof value === "object") {
    const input = value as Record<string, unknown>;
    const output: Record<string, unknown> = {};

    for (const [key, child] of Object.entries(input)) {
      output[key] = SENSITIVE_KEY.test(key) ? "[REDACTED]" : redactValue(child);
    }

    return output;
  }

  return value;
}

export function redactSensitiveFields<T>(value: T): T {
  return redactValue(value) as T;
}
