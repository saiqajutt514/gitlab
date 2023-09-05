import { Column, Entity, OneToMany } from "typeorm";
import { AbstractEntity } from "transportation-common"
import { EmailTemplateInterface } from "../interfaces/email-template.interface";
import { NOTIFY_RECEIVER } from "src/constants/templates.enum";

@Entity({ name: "email_templates" })
export class EmailTemplateEntity extends AbstractEntity implements EmailTemplateInterface {

  @Column()
  templateCode: string;

  @Column()
  templateName: string;

  @Column({ nullable: true })
  templateNameArabic: string;

  @Column()
  subject: string;

  @Column({ nullable: true })
  subjectArabic: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'text', nullable: true })
  bodyArabic: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'text', nullable: true })
  dataKeys: string;

  @Column({ type: "enum", enum: NOTIFY_RECEIVER, default: NOTIFY_RECEIVER.OTHER, nullable: true })
  receiver: NOTIFY_RECEIVER;

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