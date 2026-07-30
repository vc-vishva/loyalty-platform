/** Generic paginated response envelope. */
export interface Paginated<T> {
  results: T[];
  page: number;
  limit: number;
  totalResults: number;
  totalPages: number;
}
