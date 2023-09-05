export class CreateClickPayDto {
  amount: number;
  userId: string;
  tax?: number;
  fee?: number;
  type?: string;
  promoCode?: string;
  promoCodeAmount?: number;

  applePayToken?: any;
}
export interface ClickPayCallBackResponseDto {
  acquirerMessage?: string;
  acquirerRRN?: string;
  cartId?: string;
  customerEmail?: string;
  respCode?: string;
  respMessage?: string;
  respStatus?: string;
  signature?: string;
  token?: string;
  tranRef?: string;
}
