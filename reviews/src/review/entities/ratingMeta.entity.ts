import { Column, Entity, Index } from 'typeorm';
import { AbstractEntity } from "transportation-common"
import { IUserRatingMeta } from '../interfaces/ratings-meta.interface';

@Entity({ name: "user_ratings_meta" })
@Index(["externalId", "externalType"])
export class UserRatingMetaEntity extends AbstractEntity implements IUserRatingMeta {

  @Column({ type: "bigint" })
  externalId: number;

  @Column({ type: "integer" })
  externalType: number

  @Column({ type: "float", default: 0 })
  rating: number;

  @Column({ type: "integer", default: 0 })
  reviewCount: number

}
