import { Column, Entity, ManyToOne, OneToOne } from "typeorm";
import { AbstractEntity } from "transportation-common";
import { Vehicle } from "../vehicle.interface";

import { CabTypeEntity } from "src/modules/cab-type/entities/cab-type.entity";

@Entity({ name: "vehicle" })
export class VehicleEntity extends AbstractEntity implements Vehicle {
  @ManyToOne(() => CabTypeEntity, (cab) => cab.id, {
    eager: false,
    nullable: true,
  })
  cab: CabTypeEntity;

  @Column({ type: "tinyint", nullable: true })
  cylinders: number;

  @Column({ type: "tinyint", nullable: true })
  lkVehicleClass: number;

  @Column({ nullable: true })
  bodyType: string;

  @Column({ nullable: true })
  bodyTypeEnglish: string;

  @Column({ nullable: true })
  majorColor: string;

  @Column({ nullable: true })
  majorColorEnglish: string;

  @Column({ type: "smallint", nullable: true })
  modelYear: number;

  @Column({ type: "tinyint", nullable: true })
  vehicleCapacity: number;

  @Column({ nullable: true })
  vehicleMaker: string;

  @Column({ nullable: true })
  vehicleMakerEnglish: string;

  @Column({ nullable: true })
  vehicleModel: string;

  @Column({ nullable: true })
  vehicleModelEnglish: string;

  @Column({ nullable: true })
  vehicleImage: string;

  @Column({ length: 36, nullable: true })
  createdBy?: string;

  @Column({ length: 36, nullable: true })
  modifiedBy?: string;
}
