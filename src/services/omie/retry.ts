import "server-only";

import type { RetryOptions, SleepFunction } from "./types";

export const DEFAULT_RETRY_OPTIONS: Readonly<RetryOptions> = {
  maxRetries: 6,
  baseDelayMs: 2_000,
  maxDelayMs: 60_000,
};

export const sleep: SleepFunction = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

export function calculateBackoffDelay(
  retryNumber: number,
  options: Pick<RetryOptions, "baseDelayMs" | "maxDelayMs"> = DEFAULT_RETRY_OPTIONS,
) {
  if (!Number.isInteger(retryNumber) || retryNumber < 1) {
    throw new RangeError("retryNumber must be a positive integer");
  }

  return Math.min(options.baseDelayMs * 2 ** (retryNumber - 1), options.maxDelayMs);
}

export function isRetryableStatus(status: number) {
  return status === 429 || status >= 500;
}

export function parseRetryAfter(
  value: string | null,
  nowMs: number,
  maxDelayMs: number,
) {
  if (!value) return null;

  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.min(seconds * 1_000, maxDelayMs);
  }

  const dateMs = Date.parse(value);
  if (!Number.isFinite(dateMs)) return null;
  return Math.min(Math.max(0, dateMs - nowMs), maxDelayMs);
}
