import { AbstractEntityInterface } from "transportation-common";

export interface SmsNotificationLogInterface extends AbstractEntityInterface {

  externalId: string

  mobileNo: string

  message: string

  response?: string

  sentTime: Date

  status: number

}