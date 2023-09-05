export enum NOTIFY_STATUS {
  SENT = 1,
  FAILED = 0,
  PARTIAL = 2
};

export enum DEVICE_TYPE {
  ANDROID = 1,
  IOS = 2
};

export enum READ_STATUS {
  UNREAD = 0,
  READ = 1,
};

export interface NotifyLoggable {
  isLoggable: boolean
}

export interface SendEmailNotificationDto extends NotifyLoggable {
  externalId?: string
  receiver: string;
  subject: string;
  body: string;
  address?: any;
}

export interface PrepareNotificationPayloadDto {
  title?: string
  body: string;
  data?: any;
  options?: any;
}

export interface SendFirebaseNotificationDto extends NotifyLoggable {
  externalId?: string
  clientOs?: string
  tokens: string[];
  payload: any
}

export interface SendSMSNotificationDto extends NotifyLoggable {
  externalId?: string
  mobileNo: string;
  message: string;
  fromNo?:string;
}

export interface WalletAPIParams {
  type: string[]
  text: string
  email?: string
  mobileNo?: string
  emailSubject?: string
}
