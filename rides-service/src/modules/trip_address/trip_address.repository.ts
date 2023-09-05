import { Repository } from "typeorm";
import { EntityRepository } from 'typeorm';
import { TripAddressEntity } from "./trip_address.entity";


@EntityRepository(TripAddressEntity)
export class TripAddressRepository extends Repository<TripAddressEntity> {

}
