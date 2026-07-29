/** Request types for the product module. */

export interface CreateProductBody {
  name: string;
  description: string;
  price: number;
  stock: number;
}

export interface UpdateProductBody {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
}

export interface ProductIdParams {
  id: string;
}

/** Query for GET /products: pagination + search + price filter. */
export interface ProductListQuery {
  page: number;
  limit: number;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
}

/** Generic paginated response. */
export interface Paginated<T> {
  results: T[];
  page: number;
  limit: number;
  totalResults: number;
  totalPages: number;
}
