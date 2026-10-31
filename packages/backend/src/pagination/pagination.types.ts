export type PaginationMetadata = {
  total: number;
  page: number;
  limit: number;
};

/** One page of a list, as a service returns it: raw rows plus the page metadata. */
export type Paginated<T> = {
  data: T[];
  meta: PaginationMetadata;
};
