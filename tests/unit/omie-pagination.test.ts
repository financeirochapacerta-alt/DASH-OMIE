import { describe, expect, it, vi } from "vitest";

import { paginateOmie } from "@/services/omie/pagination";

type PageResponse = {
  items: number[];
  page: number;
  total: number;
};

describe("Omie pagination", () => {
  it("accumulates records across differently shaped page responses", async () => {
    const fetchPage = vi.fn(async (page: number): Promise<PageResponse> => ({
      items: page === 1 ? [1, 2] : [3],
      page,
      total: 2,
    }));
    const sleep = vi.fn().mockResolvedValue(undefined);

    const result = await paginateOmie({
      fetchPage,
      extractPage: (response) => ({
        records: response.items,
        currentPage: response.page,
        totalPages: response.total,
      }),
      sleep,
    });

    expect(result).toEqual({ records: [1, 2, 3], pagesFetched: 2 });
    expect(fetchPage).toHaveBeenNthCalledWith(1, 1, 50);
    expect(fetchPage).toHaveBeenNthCalledWith(2, 2, 50);
    expect(sleep).toHaveBeenCalledOnce();
    expect(sleep).toHaveBeenCalledWith(800);
  });

  it("returns an empty result for an empty single page", async () => {
    const result = await paginateOmie({
      fetchPage: async () => ({ items: [] as string[] }),
      extractPage: (response) => ({ records: response.items, currentPage: 1, totalPages: 1 }),
    });

    expect(result).toEqual({ records: [], pagesFetched: 1 });
  });
});
