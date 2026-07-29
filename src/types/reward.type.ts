/** Payload placed on the BullMQ 'reward-processing' queue for each purchase. */
export interface RewardJobData {
  customerId: string;
  businessId: string;
  purchaseId: string;
  purchaseAmount: number;
}

/** Aggregated reward totals for a customer (points by reward status). */
export interface RewardSummary {
  totalEarned: number;
  totalPending: number;
  netAvailable: number;
}

export interface CustomerIdParams {
  id: string;
}
