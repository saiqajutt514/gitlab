import { Column, Entity, Generated, Unique } from 'typeorm';
import { AbstractEntity } from 'transportation-common';
@Entity({ name: 'vehicleclass' })
export class VehicleClassEntity extends AbstractEntity {
  @Column()
  name: string;

  @Column()
  description: string;
}
