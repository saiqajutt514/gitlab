import { AbstractEntity } from "transportation-common";
import {
  Column,
  Entity,
  Generated,
  Index,
  ManyToMany,
  ManyToOne,
  OneToMany,
  Unique,
} from "typeorm";
import { CabChargesEntity } from "./cab-charges.entity";
import { CountryEntity } from "./country.entity";

@Entity("cities")
@Unique(["entryNo"])
@Unique(["name"])
@Index(["country"])
export class CityEntity extends AbstractEntity {
  @Column({ type: "bigint" })
  @Generated("increment")
  entryNo: number;

  @Column()
  name: string;

  // Relations
  @ManyToOne(() => CountryEntity, (country) => country.cities)
  country: CountryEntity;

  @OneToMany(() => CabChargesEntity, (cabCharge) => cabCharge.city)
  cabCharges: CabChargesEntity[];
}
