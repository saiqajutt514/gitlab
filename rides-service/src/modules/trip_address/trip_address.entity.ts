import { Entity, Column, Index, ManyToOne } from 'typeorm';
import { AbstractEntity } from 'transportation-common';

import { TripsEntity } from '../trips/entities/trips.entity';
import { AddressType } from './trip_address.enum';
import { IsNotEmpty, IsOptional } from 'class-validator';

@Entity('trip_addresses')
@Index(['addressType'])
@Index(['trip'])
export class TripAddressEntity extends AbstractEntity {

  @Column({ type: 'enum', enum: AddressType })
  @IsNotEmpty()
  addressType: AddressType;

  @Column()
  @IsNotEmpty()
  address: string;

  @Column({ nullable: true })
  @IsOptional()
  cityNameInArabic?: string

  @Column({ type: 'double' })
  @IsNotEmpty()
  latitude: number;

  @Column({ type: 'double' })
  @IsNotEmpty()
  longitude: number;

  @ManyToOne(() => TripsEntity, trip => trip.addresses)
  trip: TripsEntity;

}