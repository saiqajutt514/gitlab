import { AbstractEntityInterface } from "transportation-common";

export interface SmsTemplateInterface extends AbstractEntityInterface {

  templateCode: string;

  templateName: string;

  templateNameArabic: string;

  message: string;

  messageArabic: string;

  dataKeys?: string;

  isDeleted?: Date

  modifiedBy?: string

  createdBy?: string

  status?: boolean

}
