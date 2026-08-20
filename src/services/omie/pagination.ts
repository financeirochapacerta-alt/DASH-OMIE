import "server-only";

import { sleep as defaultSleep } from "./retry";
import type { PaginationOptions, PaginationResult } from "./types";

export const DEFAULT_PAGE_SIZE = 50;
export const DEFAULT_PAGE_DELAY_MS = 800;
const DEFAULT_MAX_PAGES = 10_000;

export async function paginateOmie<TResponse, TRecord>({
  fetchPage,
  extractPage,
  pageSize = DEFAULT_PAGE_SIZE,
  startPage = 1,
  pageDelayMs = DEFAULT_PAGE_DELAY_MS,
  maxPages = DEFAULT_MAX_PAGES,
  sleep = defaultSleep,
}: PaginationOptions<TResponse, TRecord>): Promise<PaginationResult<TRecord>> {
  if (pageSize < 1 || startPage < 1 || maxPages < 1 || pageDelayMs < 0) {
    throw new RangeError("Invalid pagination configuration");
  }

  const records: TRecord[] = [];
  let requestedPage = startPage;
  let pagesFetched = 0;

  while (pagesFetched < maxPages) {
    const response = await fetchPage(requestedPage, pageSize);
    const page = extractPage(response);
    pagesFetched += 1;
    records.push(...page.records);

    const hasNext =
      page.hasNextPage ??
      (page.totalPages === undefined ? false : page.currentPage < page.totalPages);

    if (!hasNext) return { records, pagesFetched };
    if (page.currentPage < requestedPage) {
      throw new Error("Pagination metadata moved backwards");
    }

    requestedPage = page.currentPage + 1;
    await sleep(pageDelayMs);
  }

  throw new Error(`Pagination exceeded the safety limit of ${maxPages} pages`);
}
