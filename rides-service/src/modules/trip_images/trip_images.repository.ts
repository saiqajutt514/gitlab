import { Repository } from "typeorm";
import { EntityRepository } from 'typeorm';
import { TripImagesEntity } from "./trip_images.entity";


@EntityRepository(TripImagesEntity)
export class TripImagesRepository extends Repository<TripImagesEntity> {

}
