import { CabTypeEntity } from "src/modules/cab-type/entities/cab-type.entity";
import { AbstractEntity } from "transportation-common";
import { Column, Entity, Index, ManyToOne, Unique } from "typeorm";
import { DayList } from "../cab-charges.enum";
import { CityEntity } from "./city.entity";
import { CountryEntity } from "./country.entity";

@Entity("cab_charges")
@Unique(["cabId", "country", "city", "day"])
@Index(["cab"])
@Index(["country"])
@Index(["city"])
export class CabChargesEntity extends AbstractEntity {
  @Column({ length: 36 })
  cabId: string;

  // @Column({ length: 36 })
  // countryId: string

  // @Column({ length: 36, nullable: true })
  // cityId: string

  @Column({ type: "enum", nullable: true, enum: DayList })
  day: number;

  @Column({ type: "float", default: 0 })
  passengerBaseFare: number;

  @Column({ type: "float", default: 0 })
  passengerCostPerMin: number;

  @Column({ type: "float", default: 0 })
  passengerCostPerKm: number;

  // Relations
  @ManyToOne(() => CabTypeEntity, (cabType) => cabType.id, { eager: true })
  cab: CabTypeEntity;

  @ManyToOne(() => CountryEntity, (country) => country.id, { eager: true })
  country: CountryEntity;

  @ManyToOne(() => CityEntity, (city) => city.id, { eager: true })
  city: CityEntity;
}
