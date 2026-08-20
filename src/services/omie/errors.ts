import "server-only";

type OmieApiErrorOptions = {
  endpoint: string;
  call: string;
  attempts: number;
  status?: number;
  faultCode?: string;
  faultString?: string;
  cause?: unknown;
  redactValues?: readonly string[];
};

function redact(value: string | undefined, secrets: readonly string[]) {
  if (!value) return value;
  return secrets.reduce(
    (safeValue, secret) => (secret ? safeValue.replaceAll(secret, "[REDACTED]") : safeValue),
    value,
  );
}

export class OmieApiError extends Error {
  readonly endpoint: string;
  readonly call: string;
  readonly attempts: number;
  readonly status?: number;
  readonly faultCode?: string;
  readonly faultString?: string;

  constructor(options: OmieApiErrorOptions) {
    const secrets = options.redactValues ?? [];
    const faultString = redact(options.faultString, secrets);
    super(faultString ? `Omie request failed: ${faultString}` : "Omie request failed", {
      cause: options.cause,
    });
    this.name = "OmieApiError";
    this.endpoint = options.endpoint;
    this.call = options.call;
    this.attempts = options.attempts;
    this.status = options.status;
    this.faultCode = redact(options.faultCode, secrets);
    this.faultString = faultString;
  }
}
