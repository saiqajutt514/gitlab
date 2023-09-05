import { DISCOUNT_TYPE } from '../enum';

export class CreateSubscriptionDto {
  packageName: string;
  packageDescription?: string;
  planType: number;
  basePrice: number;
  discountType?: number;
  discountValue?: number;
  isStandard?: boolean;
  status?: boolean;
  startDate?: Date;
  endDate?: Date;
  cabType?: string;
  isPoromoApplicable?: boolean;
  totalTrip?: number;
}
