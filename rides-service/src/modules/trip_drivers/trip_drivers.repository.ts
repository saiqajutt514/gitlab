import { Repository } from "typeorm";
import { EntityRepository } from 'typeorm';
import { TripDriver } from "./entities/trip_driver.entity";

@EntityRepository(TripDriver)
export class TripDriverRepository extends Repository<TripDriver> {

}