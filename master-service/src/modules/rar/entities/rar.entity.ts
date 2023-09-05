import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { AbstractEntity } from 'transportation-common';
import { VehicleModelEntity } from 'src/modules/vehicle-model/entities/vehicle-model.entity';
import {
  InventoryStatusEnum,
  InventoryTransmissionEnum,
} from '../enum/rar.enum';

@Entity({ name: 'ride_inventory', schema: 'transportation_admin' })
export class VIEntity extends AbstractEntity {
  /*
  @PrimaryColumn({
    generated:false
  })
  id:string;
*/
  //1
  @Column({ type: 'smallint' })
  modelYear: number;

  //2
  @Column()
  bodyColor: string;

  //3
  @Column()
  category: string;

  //4
  @Column()
  sequenceNo: string;

  //5
  @Column({ type: 'smallint' })
  displacement: number;

  //6
  @Column() //fuel type is like petrol, hybrid, deisel,
  fuelType: string;

  //7
  @Column({ type: 'tinyint' })
  noOfCylinder: number;

  //8
  @Column({ type: 'tinyint' })
  seatingCapacity: number;

  //9
  @Column({
    type: 'enum',
    enum: InventoryTransmissionEnum,
  })
  transmission: InventoryTransmissionEnum;

  //10
  @Column({
    type: 'enum',
    enum: InventoryStatusEnum,
  })
  iStatus: InventoryStatusEnum;

  //11
  @Column('boolean', { default: false })
  isRegistered: boolean;

  //12
  @Column()
  modelId: string;

  //13
  @Column({ nullable: true })
  inventoryIcon: string;

  //14
  @ManyToOne(() => VehicleModelEntity, (models) => models.id, {
    eager: false,
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'modelId', referencedColumnName: 'id' })
  model: VehicleModelEntity;
}
