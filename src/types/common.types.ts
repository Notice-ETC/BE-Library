export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginationResult {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

