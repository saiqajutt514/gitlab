import { IsNotEmpty } from 'class-validator';

export class ExternalReviewDetailDto {

  @IsNotEmpty()
  externalId: number

  @IsNotEmpty()
  externalType: number

}

export class ExternalReviewsListDto {

  @IsNotEmpty()
  externalIds: number[]

  @IsNotEmpty()
  externalType: string

}