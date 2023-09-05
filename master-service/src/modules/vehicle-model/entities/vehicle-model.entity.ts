import {
  Column,
  Entity,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Generated,
  Unique,
} from 'typeorm';
import { AbstractEntity } from 'transportation-common';

import { VehicleMakerEntity } from '../../vehicle-maker/entities/vehicle-maker.entity';

@Entity({ name: 'vehiclemodels' })
export class VehicleModelEntity extends AbstractEntity {
  @Column()
  model: string;

  @Column({ nullable: true })
  modelEnglish: string;

  @Column()
  makerId: string;

  @Column({ nullable: true })
  cabTypeId: string;

  @Column({ nullable: true })
  cabTypeName: string;

  @ManyToOne(() => VehicleMakerEntity, (makers) => makers.id, {
    eager: false,
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'makerId', referencedColumnName: 'id' })
  maker: VehicleMakerEntity;
}
