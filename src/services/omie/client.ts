import "server-only";

import { getOmieEnv } from "@/lib/env/server";

import { OmieApiError } from "./errors";
import { consoleOmieLogger, type OmieLogger } from "./logger";
import {
  calculateBackoffDelay,
  DEFAULT_RETRY_OPTIONS,
  isRetryableStatus,
  parseRetryAfter,
  sleep as defaultSleep,
} from "./retry";
import type {
  FetchLike,
  OmieCredentials,
  OmieRequestEnvelope,
  OmieRequestOptions,
  RetryOptions,
  SleepFunction,
} from "./types";

export const OMIE_BASE_URL = "https://app.omie.com.br/api/v1";
export const DEFAULT_TIMEOUT_MS = 30_000;

type OmieClientOptions = {
  credentials: OmieCredentials;
  baseUrl?: string;
  timeoutMs?: number;
  retry?: Partial<RetryOptions>;
  fetch?: FetchLike;
  sleep?: SleepFunction;
  logger?: OmieLogger;
  now?: () => number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getFault(body: unknown) {
  if (!isRecord(body)) return {};
  const code = body.faultcode;
  const message = body.faultstring;
  return {
    faultCode: typeof code === "string" || typeof code === "number" ? String(code) : undefined,
    faultString: typeof message === "string" ? message : undefined,
  };
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function normalizeEndpoint(endpoint: string) {
  const normalized = endpoint.replace(/^\/+|\/+$/g, "");
  if (!normalized || normalized.includes("..") || normalized.includes("://")) {
    throw new TypeError("Invalid Omie endpoint");
  }
  return normalized;
}

export class OmieClient {
  private readonly credentials: OmieCredentials;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly retry: RetryOptions;
  private readonly fetch: FetchLike;
  private readonly sleep: SleepFunction;
  private readonly logger: OmieLogger;
  private readonly now: () => number;

  constructor(options: OmieClientOptions) {
    this.credentials = options.credentials;
    this.baseUrl = (options.baseUrl ?? OMIE_BASE_URL).replace(/\/+$/, "");
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.retry = { ...DEFAULT_RETRY_OPTIONS, ...options.retry };
    this.fetch = options.fetch ?? globalThis.fetch;
    this.sleep = options.sleep ?? defaultSleep;
    this.logger = options.logger ?? consoleOmieLogger;
    this.now = options.now ?? Date.now;

    if (!this.credentials.appKey || !this.credentials.appSecret) {
      throw new Error("Omie credentials are required");
    }
    if (this.timeoutMs < 1 || this.retry.maxRetries < 0) {
      throw new RangeError("Invalid Omie client configuration");
    }
  }

  async request<TResponse, TParam = Record<string, unknown>>({
    endpoint,
    call,
    param,
  }: OmieRequestOptions<TParam>): Promise<TResponse> {
    const safeEndpoint = normalizeEndpoint(endpoint);
    if (!call.trim()) throw new TypeError("Omie call is required");

    const url = `${this.baseUrl}/${safeEndpoint}/`;
    const envelope: OmieRequestEnvelope<TParam> = {
      call,
      app_key: this.credentials.appKey,
      app_secret: this.credentials.appSecret,
      param,
    };
    const redactValues = [this.credentials.appKey, this.credentials.appSecret];
    const maxAttempts = this.retry.maxRetries + 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const startedAt = this.now();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
      this.logger.log({ event: "request", endpoint: safeEndpoint, call, attempt });

      try {
        const response = await this.fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(envelope),
          signal: controller.signal,
        });
        const body = await readJson(response);
        clearTimeout(timeout);
        const fault = getFault(body);

        if (!response.ok) {
          if (isRetryableStatus(response.status) && attempt < maxAttempts) {
            const retryNumber = attempt;
            const retryAfter = parseRetryAfter(
              response.headers.get("retry-after"),
              this.now(),
              this.retry.maxDelayMs,
            );
            const delay = retryAfter ?? calculateBackoffDelay(retryNumber, this.retry);
            this.logger.log({
              event: "retry",
              endpoint: safeEndpoint,
              call,
              attempt,
              status: response.status,
              errorCode: fault.faultCode,
            });
            await this.sleep(delay);
            continue;
          }

          throw new OmieApiError({
            endpoint: safeEndpoint,
            call,
            attempts: attempt,
            status: response.status,
            ...fault,
            redactValues,
          });
        }

        if (fault.faultCode || fault.faultString) {
          throw new OmieApiError({
            endpoint: safeEndpoint,
            call,
            attempts: attempt,
            status: response.status,
            ...fault,
            redactValues,
          });
        }

        this.logger.log({
          event: "success",
          endpoint: safeEndpoint,
          call,
          attempt,
          status: response.status,
          durationMs: this.now() - startedAt,
        });
        return body as TResponse;
      } catch (error) {
        if (error instanceof OmieApiError || (error instanceof Error && error.name === "OmieApiError")) {
          throw error;
        }

        if (attempt < maxAttempts) {
          const delay = calculateBackoffDelay(attempt, this.retry);
          this.logger.log({ event: "retry", endpoint: safeEndpoint, call, attempt });
          await this.sleep(delay);
          continue;
        }

        this.logger.log({ event: "failure", endpoint: safeEndpoint, call, attempt });
        throw new OmieApiError({
          endpoint: safeEndpoint,
          call,
          attempts: attempt,
          faultCode: controller.signal.aborted ? "TIMEOUT" : "NETWORK_ERROR",
          cause: error,
          redactValues,
        });
      } finally {
        clearTimeout(timeout);
      }
    }

    throw new Error("Unreachable Omie retry state");
  }
}

export function createOmieClient(options: Omit<OmieClientOptions, "credentials"> = {}) {
  const env = getOmieEnv();
  return new OmieClient({
    ...options,
    credentials: { appKey: env.OMIE_APP_KEY, appSecret: env.OMIE_APP_SECRET },
  });
}
