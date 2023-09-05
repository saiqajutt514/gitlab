export class accountInquiryDto {
  accNum: string;
}

export class xferBtwCustAccDto {
  amount: number;
  srcAccNum: string;
  srcCurCode: string;
  srcTrnDesc: string;
  targAccNum: string;
  benFullName: string;
  benBankCode: string;
  targCurCode: string;
  pmtDesc: string;
  memo: string;
  entityType: number;
  parentId: string;
  trnDesc?: string;
}
