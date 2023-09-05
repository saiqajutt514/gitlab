import { AbstractEntityInterface } from "transportation-common";

export interface RejectedReasonInterface extends AbstractEntityInterface {

  reason: string

  reasonArabic?: string

  reasonType: string

  createdBy?: string

  modifiedBy?: string
}