import { Column, Entity, Index } from "typeorm";
import { AbstractEntity } from "transportation-common"

import { REASON_TYPE } from '../enum/rejected-reason.enum';

@Entity({ name: "rejected_reasons" })
@Index(['reasonType'])
export class RejectedReasonEntity extends AbstractEntity {

  @Column()
  reason: string;

  @Column({ nullable: true })
  reasonArabic: string;

  @Column({ type: "enum", enum: REASON_TYPE })
  reasonType: REASON_TYPE;

  @Column({ length: 36, nullable: true })
  createdBy?: string

  @Column({ length: 36, nullable: true })
  modifiedBy?: string

  @Column({ type: "datetime", nullable: true })
  isDeleted?: Date

  @Column({ type: "boolean", default: true })
  status: boolean

}