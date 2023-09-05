import { AbstractEntity } from "transportation-common";
import { Column, Entity } from "typeorm";

@Entity({ name: "audit_log" })
export class AuditLogEntity extends AbstractEntity {

  @Column({ comment: "Module name" })
  moduleName: string;

  @Column({ comment: "Table name" })
  entityName: string;

  @Column({ comment: "Table record id" })
  entityId: string;

  @Column({ comment: "Action - insert/update/delete" })
  actionType: string;

  @Column({ type: 'json', nullable: true })
  oldValues: string;

  @Column({ type: 'json', nullable: true })
  newValues: string;

  @Column({ length: 36, nullable: true})
  createdBy: string

}
