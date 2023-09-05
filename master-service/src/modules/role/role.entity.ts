import { BeforeInsert, BeforeUpdate, Column, Entity, OneToMany, Unique } from "typeorm";
import { AbstractEntity } from "transportation-common"

import { AdminUserEntity } from "../admin-user/admin-user.entity";

@Entity({ name: "role" })
@Unique(['code'])
export class RoleEntity extends AbstractEntity {

  @Column()
  code: string;

  @Column()
  title: string;

  @Column({ type: 'json', nullable: true, comment: 'Access Capabilities List'})
  capabilites: string;

  @Column({ length: 36, nullable: true })
  createdBy?: string

  @Column({ length: 36, nullable: true })
  modifiedBy?: string

  @Column({ type: "datetime", nullable: true })
  isDeleted?: Date

  @Column({ type: "boolean", default: true })
  status: boolean

  // Relations
  @OneToMany(() => AdminUserEntity, admin => admin.role)
  admins: AdminUserEntity[];

  @BeforeInsert()
  generateCode() {
    this.code = this.title?.trim()?.replace(/ /g, '-')?.replace(/[^A-Za-z0-9-_]/g, '')?.toLowerCase();
  }

}
