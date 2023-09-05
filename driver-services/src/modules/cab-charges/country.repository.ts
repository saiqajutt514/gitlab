import { EntityRepository } from "typeorm";
import { BaseAbstractRepository } from "transportation-common";

import { CountryEntity } from "./entities/country.entity";

@EntityRepository(CountryEntity)
export class CountryRepository extends BaseAbstractRepository<CountryEntity> {}
