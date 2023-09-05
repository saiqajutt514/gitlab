import { AbstractEntityInterface } from "transportation-common";

export interface PushNotificationLogInterface extends AbstractEntityInterface {

  externalId: string

  deviceToken: string

  deviceType: number

  title?: string

  message: string

  payload?: string

  response?: string

  sentTime: Date

  status: number

}