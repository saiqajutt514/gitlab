import { IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

import { ReviewAnswer } from "../review.interface"

export class CreateReviewDto {

  @IsNotEmpty()
  externalId: string

  @IsNotEmpty()
  externalIdFor: number

  @IsNotEmpty()
  externalIdBy: number

  @IsNotEmpty()
  externalType: number

  @IsNotEmpty()
  title: string

  @IsOptional()
  description: string

  @IsOptional()
  @IsNumber()
  rating: number

  @IsNotEmpty()
  @IsOptional()
  answers: string

}
