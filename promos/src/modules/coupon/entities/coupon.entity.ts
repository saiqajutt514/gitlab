import { Column, Entity, Index, BeforeInsert, BeforeUpdate } from 'typeorm';
import { AbstractEntity } from 'transportation-common';

import {
  applicableFor,
  areaType,
  borneBy,
  gender,
  IPromoCode,
  IPromoCodeMethod,
  IPromoCodeType,
} from '../interfaces/promoCode.interface';

@Entity({ name: 'promo_codes' })
@Index(['code'])
@Index(['status'])
export class PromoCodesEntity extends AbstractEntity implements IPromoCode {
  @Column({ length: 64, nullable: true })
  code: string;

  @Column({ nullable: true })
  message: string;

  @Column({ type: 'enum', enum: borneBy, default: borneBy.RiDE })
  borneBy: borneBy;

  @Column({ type: 'enum', enum: gender, default: gender.all })
  gender: gender;

  @Column({ type: 'enum', enum: applicableFor, default: applicableFor.rider })
  applicableFor: applicableFor;

  @Column({ type: 'enum', enum: areaType, default: areaType.any })
  areaType: areaType;

  @Column({ length: 200, nullable: true })
  area: string;

  @Column({ type: 'enum', enum: IPromoCodeType })
  promoCodeType: IPromoCodeType;

  @Column({ type: 'enum', enum: IPromoCodeMethod })
  method: IPromoCodeMethod;

  @Column({ type: 'int', default: 0 })
  userUsage?: number;

  @Column({ type: 'float' })
  amount: number;

  @Column({ type: 'float', nullable: true })
  minimumAmountInCart: number;

  @Column({ type: 'float', default: 0 })
  totalBudget: number;

  @Column({ type: 'float', default: 0 })
  totalUtilised: number;

  @Column({ type: 'float', nullable: true })
  maximumDiscountAmount: number;

  @Column({ length: 36, nullable: true })
  userId: string;

  @Column({ type: 'int', nullable: true })
  maximumTotalUsage: number;

  @Column({ type: 'int', nullable: true })
  maximumUsagePerUser: number;

  @Column({ type: 'datetime' })
  startAt: Date;

  @Column({ type: 'datetime' })
  endAt: Date;

  @Column({ type: 'boolean', default: true })
  status: boolean;

  @Column({ type: 'datetime', nullable: true })
  deletedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  capitalizeCode() {
    this.code = this.code?.trim()?.toUpperCase();
  }
}
