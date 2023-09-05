import { Repository } from "typeorm";
import { EntityRepository } from 'typeorm';
import { TripLocation } from "./entities/trip_location.entity";

@EntityRepository(TripLocation)
export class TripLocationRepository extends Repository<TripLocation> {

}