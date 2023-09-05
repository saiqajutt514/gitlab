import { Entity, Column, Index, ManyToOne } from 'typeorm';
import { AbstractEntity } from 'transportation-common';

import { IsNotEmpty, IsOptional } from 'class-validator';

@Entity('demand_zone')
export class highDemandZoneEntity extends AbstractEntity {
  @Column({ nullable: true })
  address?: string;

  @Column({ nullable: true })
  addressInArabic?: string;

  @Column({ type: 'double' })
  @IsNotEmpty()
  latitude: number;

  @Column({ type: 'double' })
  @IsNotEmpty()
  longitude: number;
}
