import { Entity, Column, ManyToOne, Index } from 'typeorm';
import { AbstractEntity } from 'transportation-common';

import { TripsEntity } from '../trips/entities/trips.entity';
import { IsNotEmpty } from 'class-validator';

@Entity('trip_images')
@Index(['trip'])
@Index(['type'])
export class TripImagesEntity extends AbstractEntity {

  @Column()
  @IsNotEmpty()
  image: string;

  @Column()
  @IsNotEmpty()
  type: number;

  @Column()
  @IsNotEmpty()
  imageBy: number;

  @ManyToOne(() => TripsEntity, trip => trip.images)
  trip: TripsEntity;

}