import { AbstractEntity } from 'transportation-common';
import { Column, Entity, Index } from "typeorm";

@Entity('remaining_charges')
@Index(['tripId'])
@Index(['riderId'])
export class RemainingChargesEntity extends AbstractEntity {

  @Column({ length: 36 })
  tripId: string

  @Column({ length: 36 })
  riderId: string

  @Column({ type: 'float', default: 0 })
  remainingCharge: number

}