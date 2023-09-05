import { AbstractEntity } from "transportation-common";
import { Column, Entity, ManyToOne, Unique } from "typeorm";
import { CityEntity } from "../cab-charges/entities/city.entity";

@Entity("customized_charges")
@Unique(["city", "fromDate", "toDate"])
export class CustomizedChargesEntity extends AbstractEntity {
  @Column()
  title: string;

  @Column({ type: "float", default: 1 })
  multiplyRate: number;

  @Column({ type: "datetime" })
  fromDate: Date;

  @Column({ type: "datetime" })
  toDate: Date;

  // Relations
  @ManyToOne(() => CityEntity, (city) => city.id, { eager: true })
  city: CityEntity;
}
