/** Payload placed on the BullMQ 'reward-processing' queue for each purchase. */
export interface RewardJobData {
  customerId: string;
  businessId: string;
  purchaseId: string;
  purchaseAmount: number;
}
