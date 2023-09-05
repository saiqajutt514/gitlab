import { Column, Entity, OneToMany, Unique } from "typeorm";
import { AbstractEntity } from "transportation-common";
import { ICabType } from "../cab-type.interface";
import { CaptainEntity } from "src/modules/captain/captain.entity";
import { VehicleEntity } from "src/modules/vehicle/entities/vehicle.entity";
import { CabChargesEntity } from "src/modules/cab-charges/entities/cab-charges.entity";

@Entity({ name: "cab_type" })
@Unique(["name"])
export class CabTypeEntity extends AbstractEntity implements ICabType {
  @Column()
  name: string;

  @Column({ nullable: true })
  nameArabic: string;

  @Column()
  description: string;

  @Column({ nullable: true })
  descriptionArabic: string;

  @Column({ type: "tinyint" })
  noOfSeats: number;

  @Column({ type: "tinyint" })
  order: number;

  // Passenger
  @Column({ type: "float", default: 1, nullable: true })
  passengerEstimatedTimeArrival: number;

  @Column({ type: "float", default: 1, nullable: true })
  passengerDriverMatching: number;

  @Column({ type: "float", default: 1, nullable: true })
  passengerBaseFare: number;

  @Column({ type: "float", default: 0, nullable: true })
  passengerBaseDistance: number;

  @Column({ type: "float", default: 0, nullable: true })
  passengerBaseTime: number;

  @Column({ type: "float", default: 0, nullable: true })
  passengerCostPerMin: number;

  @Column({ type: "float", default: 1, nullable: true })
  passengerCostPerKm: number;

  @Column({ type: "float", default: 0, nullable: true })
  waitChargePerMin: number;

  @Column({ type: "float", default: 0, nullable: true })
  passengerCancellationCharge: number;

  @Column({ type: "float", default: 1, nullable: true })
  passengerDriverDistribution: number;

  // Share
  @Column({ type: "float", default: 1, nullable: true })
  shareEstimatedTimeArrival: number;

  @Column({ type: "float", default: 1, nullable: true })
  shareDriverMatching: number;

  @Column({ type: "float", default: 0, nullable: true })
  shareBaseFare: number;

  @Column({ type: "float", default: 0, nullable: true })
  shareBaseDistance: number;

  @Column({ type: "float", default: 0, nullable: true })
  shareBaseTime: number;

  @Column({ type: "float", default: 0, nullable: true })
  shareCostPerMin: number;

  @Column({ type: "float", default: 0, nullable: true })
  shareCancellationCharge: number;

  @Column({ type: "float", default: 1, nullable: true })
  shareDriverDistribution: number;

  @Column({ type: "float", default: 1, nullable: true })
  shareMaxThreshold: number;

  // Pool
  @Column({ type: "float", default: 1, nullable: true })
  carpoolEstimatedTimeArrival: number;

  @Column({ type: "float", default: 1, nullable: true })
  carpoolDriverMatching: number;

  @Column({ type: "float", default: 1, nullable: true })
  carpoolCostPerKmMin: number;

  @Column({ type: "float", default: 1, nullable: true })
  carpoolCostPerKmMax: number;

  @Column({ type: "float", default: 0, nullable: true })
  carpoolUserCancellationCharge: number;

  @Column({ type: "float", default: 0, nullable: true })
  carpoolDriverCancellationCharge: number;

  @Column({ type: "float", default: 1, nullable: true })
  carpoolDriverDistribution: number;

  @Column({ nullable: true })
  categoryIcon: string;

  @Column({ length: 36, nullable: true })
  createdBy?: string;

  @Column({ length: 36, nullable: true })
  modifiedBy?: string;

  @Column({ type: "datetime", nullable: true })
  isDeleted?: Date;

  @Column({ type: "boolean", default: true })
  status: boolean;

  // Relations
  @OneToMany(() => CaptainEntity, (captain) => captain.cab)
  captains: CaptainEntity[];

  @OneToMany(() => VehicleEntity, (vehicle) => vehicle.cab)
  vehicles: VehicleEntity[];

  @OneToMany(() => CabChargesEntity, (cabCharge) => cabCharge.cab)
  cabCharges: CabChargesEntity[];
}
