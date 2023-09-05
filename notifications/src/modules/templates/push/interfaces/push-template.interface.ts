import { AbstractEntityInterface } from "transportation-common";

export interface PushTemplateInterface extends AbstractEntityInterface {

  templateCode: string;

  templateName: string;

  templateNameArabic: string;

  title?: string;

  titleArabic?: string;

  message: string;

  messageArabic: string;

  dataKeys?: string;

  isDeleted?: Date

  modifiedBy?: string

  createdBy?: string

  status?: boolean

}
