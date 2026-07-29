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
