import { AbstractEntityInterface } from "transportation-common";

export interface EmailTemplateInterface extends AbstractEntityInterface {

  templateCode: string;

  templateName: string;

  templateNameArabic: string;

  subject: string;

  subjectArabic: string;

  body: string;

  bodyArabic: string;

  address?: any;

  dataKeys?: string;

  isDeleted?: Date

  modifiedBy?: string

  createdBy?: string

  status?: boolean

}
