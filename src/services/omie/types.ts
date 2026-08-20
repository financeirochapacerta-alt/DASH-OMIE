export type OmieCredentials = {
  appKey: string;
  appSecret: string;
};

export type OmieRequestOptions<TParam> = {
  endpoint: string;
  call: string;
  param: readonly TParam[];
};

export type OmieRequestEnvelope<TParam> = {
  call: string;
  app_key: string;
  app_secret: string;
  param: readonly TParam[];
};

export type FetchLike = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

export type SleepFunction = (milliseconds: number) => Promise<void>;

export type RetryOptions = {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
};

export type PaginationPage<TRecord> = {
  records: readonly TRecord[];
  currentPage: number;
  totalPages?: number;
  hasNextPage?: boolean;
};

export type PaginationOptions<TResponse, TRecord> = {
  fetchPage: (page: number, pageSize: number) => Promise<TResponse>;
  extractPage: (response: TResponse) => PaginationPage<TRecord>;
  pageSize?: number;
  startPage?: number;
  pageDelayMs?: number;
  maxPages?: number;
  sleep?: SleepFunction;
};

export type PaginationResult<TRecord> = {
  records: TRecord[];
  pagesFetched: number;
};
