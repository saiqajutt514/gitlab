import { AbstractEntity } from "transportation-common";
import { Column, Entity, ManyToMany, OneToMany, Unique } from "typeorm";
import { CabChargesEntity } from "./cab-charges.entity";
import { CityEntity } from "./city.entity";

@Entity("countries")
@Unique(["name"])
// @Unique(['isoCode3'])
export class CountryEntity extends AbstractEntity {
  @Column({ length: 100 })
  name: string;

  // @Column({ length: 10 })
  // isoCode3: string

  // Relations
  @OneToMany(() => CityEntity, (city) => city.country, {
    cascade: true,
    eager: true,
  })
  cities: CityEntity[];

  @OneToMany(() => CabChargesEntity, (cabCharge) => cabCharge.country)
  cabCharges: CabChargesEntity[];
}
