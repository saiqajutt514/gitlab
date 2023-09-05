import { Column, Entity, Generated, Unique } from 'typeorm';
import { AbstractEntity } from 'transportation-common';

@Entity({ name: 'vehiclemakers' })
@Unique(['makerEnglish', 'maker'])
export class VehicleMakerEntity extends AbstractEntity {
  @Column()
  maker: string;

  @Column({ nullable: true })
  makerEnglish: string;

  @Column()
  status: number;

  @Column({ nullable: true })
  makerIcon: string;
}
