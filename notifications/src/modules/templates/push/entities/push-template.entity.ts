import { Column, Entity, OneToMany } from "typeorm";
import { AbstractEntity } from "transportation-common"
import { PushTemplateInterface } from "../interfaces/push-template.interface";
import { NOTIFY_RECEIVER } from "src/constants/templates.enum";

@Entity({ name: "push_templates" })
export class PushTemplateEntity extends AbstractEntity implements PushTemplateInterface {

  @Column()
  templateCode: string;

  @Column()
  templateName: string;

  @Column({ nullable: true })
  templateNameArabic: string;

  @Column({ nullable: true })
  title: string;

  @Column({ nullable: true })
  titleArabic: string;

  @Column({ type: 'text' })
  message: string;

  @Column({  type: 'text', nullable: true })
  messageArabic: string;

  @Column({ type: 'text', nullable: true })
  dataKeys: string;

  @Column({ type: "enum", enum: NOTIFY_RECEIVER, default: NOTIFY_RECEIVER.OTHER, nullable: true })
  receiver: NOTIFY_RECEIVER

  @Column({ length: 36, nullable: true})
  createdBy?: string

  @Column({ length: 36, nullable: true})
  modifiedBy?: string

  @Column({ type: "datetime", nullable: true })
  isDeleted?: Date

  @Column({ type: "boolean", default: true })
  status: boolean

  @Column({ type: "boolean", default: true })
  logStatus: boolean

}