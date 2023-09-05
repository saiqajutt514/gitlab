import { AbstractEntityInterface } from "transportation-common";

export interface IUserRatingMeta extends AbstractEntityInterface {

  externalId: number

  externalType: number

  rating: number;

  reviewCount: number;

}
