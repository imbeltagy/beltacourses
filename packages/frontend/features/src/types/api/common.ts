export type PaginationMetadata = {
  total: number;
  page: number;
  limit: number;
};

/** Every list endpoint on the API returns this envelope. */
export type Paginated<T> = {
  data: T[];
  meta: PaginationMetadata;
};

export type PaginationQuery = {
  page?: number;
  /** The API caps this at 100. */
  limit?: number;
};

export const DEFAULT_PAGE_SIZE = 20;
