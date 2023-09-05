import { AbstractEntityInterface } from "transportation-common";

export interface EmailNotificationLogInterface extends AbstractEntityInterface {

  externalId: string

  receiver: string

  subject?: string

  body: string

  address?: string

  response?: string

  sentTime: Date

  status: number

}