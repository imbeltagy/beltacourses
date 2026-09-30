/** Every list endpoint on the API returns this envelope. */
export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

export type PaginationQuery = {
  page?: number;
  /** The API caps this at 100. */
  limit?: number;
};

export const DEFAULT_PAGE_SIZE = 20;
