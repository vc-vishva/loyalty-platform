/** Request-body types for the business module. */

export interface CreateBusinessBody {
  name: string;
  slug: string;
  rewardUnitValue: number;
}

export interface BusinessIdParams {
  id: string;
}
