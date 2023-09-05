import { Column, Entity, Unique, Index, ManyToOne } from "typeorm";
import { AbstractEntity } from "transportation-common"
import { IsEmail } from "class-validator";
import * as bcrypt from 'bcrypt';

import { RoleEntity } from "../role/role.entity";

@Entity({ name: "admin" })
@Index(['role'])
@Index(['status'])
export class AdminUserEntity extends AbstractEntity {

  @Column()
  fullName: string;

  @Column()
  @IsEmail()
  email: string;

  @Column({ nullable: true })
  password: string;

  @Column({ nullable: true })
  salt: string;

  @ManyToOne(() => RoleEntity, role => role.id, { eager: false, nullable: true })
  role: RoleEntity;

  @Column({ nullable: true })
  profileImage?: string;

  @Column({ type: "datetime", nullable: true })
  lastAccessedAt: Date;

  @Column({ nullable: true })
  resetPasswordToken?: string

  @Column({ type: "datetime", nullable: true })
  passwordUpdatedAt?: Date

  @Column({ type: "datetime", nullable: true, comment: "generated time of resetPasswordToken" })
  tokenCreatedAt?: Date

  @Column({ nullable: true, default: 0 })
  emergencyTrips?: number

  @Column({ nullable: true, default: 0 })
  requestsResolved?: number

  @Column({ nullable: true, default: 0 })
  dispatcherTrips?: number

  @Column({ length: 36, nullable: true })
  createdBy?: string

  @Column({ length: 36, nullable: true })
  modifiedBy?: string

  @Column({ type: "datetime", nullable: true })
  isDeleted?: Date

  @Column({ type: "boolean", default: true })
  status: boolean

  async validatePassword(password: string): Promise<boolean> {
    const hash = await bcrypt.hash(password, this.salt);
    return hash === this.password;
  }

}
