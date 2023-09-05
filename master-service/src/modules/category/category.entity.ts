import { Column, Entity, OneToMany } from "typeorm";
import { AbstractEntity } from "transportation-common"

import { PermissionEntity } from "../permission/permission.entity";
import { AdminModuleTypes } from "./category.enum";

@Entity({ name: "category" })
export class CategoryEntity extends AbstractEntity {

  @Column()
  categoryName: string;

  @Column({ length: 36, nullable: true })
  createdBy?: string

  @Column({ length: 36, nullable: true })
  modifiedBy?: string

  @Column({ type: "datetime", nullable: true })
  isDeleted?: Date

  @Column({ type: "boolean", default: true })
  status: boolean

  @Column({ type: "enum", enum: AdminModuleTypes, default: AdminModuleTypes.TRANSPORTATION })
  moduleType: number

  // Relations
  @OneToMany(() => PermissionEntity, permission => permission.category)
  permissions: PermissionEntity[];

}
