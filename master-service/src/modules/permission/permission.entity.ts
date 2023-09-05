import { Column, Entity, ManyToOne } from "typeorm";
import { AbstractEntity } from "transportation-common"

import { CategoryEntity } from "../category/category.entity";

@Entity({ name: "permission" })
export class PermissionEntity extends AbstractEntity {

  @Column()
  accessName: string;

  @Column()
  accessCode: string;

  @Column({ default: 1, nullable: true })
  sequence: number;

  @Column({ length: 36, nullable: true })
  createdBy?: string

  @Column({ length: 36, nullable: true })
  modifiedBy?: string

  @Column({ type: "datetime", nullable: true })
  isDeleted?: Date

  @Column({ type: "boolean", default: true })
  status: boolean

  @ManyToOne(() => CategoryEntity, category => category.id, { eager: false, nullable: true })
  category: CategoryEntity;

}
