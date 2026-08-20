import { afterEach, describe, expect, it, vi } from "vitest";

import { OmieClient } from "@/services/omie/client";
import { OmieApiError } from "@/services/omie/errors";
import type { FetchLike } from "@/services/omie/types";

const credentials = {
  appKey: "unit-test-app-key",
  appSecret: "unit-test-app-secret",
};

function jsonResponse(body: unknown, status = 200, headers?: HeadersInit) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

function request(client: OmieClient) {
  return client.request<{ ok: boolean }, { pagina: number }>({
    endpoint: "geral/clientes",
    call: "ListarClientes",
    param: [{ pagina: 1 }],
  });
}

afterEach(() => vi.useRealTimers());

describe("OmieClient", () => {
  it("sends the standard Omie payload and returns a successful response", async () => {
    const fetchMock = vi.fn<FetchLike>().mockResolvedValue(jsonResponse({ ok: true }));
    const client = new OmieClient({ credentials, fetch: fetchMock });

    await expect(request(client)).resolves.toEqual({ ok: true });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://app.omie.com.br/api/v1/geral/clientes/");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual({
      call: "ListarClientes",
      app_key: credentials.appKey,
      app_secret: credentials.appSecret,
      param: [{ pagina: 1 }],
    });
  });

  it("aborts a request after the configured timeout", async () => {
    vi.useFakeTimers();
    const fetchMock: FetchLike = (_input, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () =>
          reject(new DOMException("Aborted", "AbortError")),
        );
      });
    const client = new OmieClient({
      credentials,
      fetch: fetchMock,
      timeoutMs: 100,
      retry: { maxRetries: 0 },
    });

    const expectation = expect(request(client)).rejects.toMatchObject({
      faultCode: "TIMEOUT",
      attempts: 1,
    });
    await vi.advanceTimersByTimeAsync(100);
    await expectation;
  });

  it.each([429, 500])("retries transient HTTP %s responses", async (status) => {
    const fetchMock = vi
      .fn<FetchLike>()
      .mockResolvedValueOnce(jsonResponse({ faultstring: "temporary" }, status))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));
    const sleep = vi.fn().mockResolvedValue(undefined);
    const client = new OmieClient({ credentials, fetch: fetchMock, sleep });

    await expect(request(client)).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(2_000);
  });

  it("respects Retry-After without exceeding configured delay", async () => {
    const fetchMock = vi
      .fn<FetchLike>()
      .mockResolvedValueOnce(jsonResponse({}, 429, { "retry-after": "90" }))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));
    const sleep = vi.fn().mockResolvedValue(undefined);
    const client = new OmieClient({ credentials, fetch: fetchMock, sleep });

    await request(client);
    expect(sleep).toHaveBeenCalledWith(60_000);
  });

  it("does not retry functional HTTP 400 errors", async () => {
    const fetchMock = vi
      .fn<FetchLike>()
      .mockResolvedValue(jsonResponse({ faultcode: "INVALID", faultstring: "Bad input" }, 400));
    const sleep = vi.fn().mockResolvedValue(undefined);
    const client = new OmieClient({ credentials, fetch: fetchMock, sleep });

    await expect(request(client)).rejects.toMatchObject({ status: 400, attempts: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it("stops at the configured retry limit", async () => {
    const fetchMock = vi.fn<FetchLike>().mockImplementation(async () => jsonResponse({}, 500));
    const sleep = vi.fn().mockResolvedValue(undefined);
    const client = new OmieClient({
      credentials,
      fetch: fetchMock,
      sleep,
      retry: { maxRetries: 2 },
    });

    await expect(request(client)).rejects.toMatchObject({ status: 500, attempts: 3 });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledTimes(2);
  });

  it("normalizes functional faults returned with HTTP 200", async () => {
    const fetchMock = vi.fn<FetchLike>().mockResolvedValue(
      jsonResponse({ faultcode: "SOAP-ENV:Client-1", faultstring: "Operação inválida" }),
    );
    const client = new OmieClient({ credentials, fetch: fetchMock });

    await expect(request(client)).rejects.toMatchObject({
      name: "OmieApiError",
      status: 200,
      faultCode: "SOAP-ENV:Client-1",
      faultString: "Operação inválida",
    });
  });

  it("redacts credentials from normalized errors and structured logs", async () => {
    const fetchMock = vi.fn<FetchLike>().mockResolvedValue(
      jsonResponse(
        {
          faultcode: credentials.appKey,
          faultstring: `Rejected ${credentials.appSecret}`,
        },
        400,
      ),
    );
    const entries: unknown[] = [];
    const client = new OmieClient({
      credentials,
      fetch: fetchMock,
      logger: { log: (entry) => entries.push(entry) },
    });

    const error = await request(client).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(OmieApiError);
    expect(JSON.stringify(error)).not.toContain(credentials.appKey);
    expect(String(error)).not.toContain(credentials.appSecret);
    expect(JSON.stringify(entries)).not.toContain(credentials.appKey);
    expect(JSON.stringify(entries)).not.toContain(credentials.appSecret);
  });
});
