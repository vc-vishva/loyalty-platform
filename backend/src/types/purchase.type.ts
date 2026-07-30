/** Request types for the purchase module. */

export interface CreatePurchaseBody {
  productId: string;
  quantity: number;
}

export interface PurchaseIdParams {
  id: string;
}
