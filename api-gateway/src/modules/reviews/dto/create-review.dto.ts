import { IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateReviewDto {

  @IsNotEmpty()
  tripId: string

  @IsNotEmpty()
  title: string

  @IsOptional()
  description: string

  @IsNumber()
  rating: number

  @IsOptional()
  answers: string

}

export class ExternalIdDto {

  @IsNotEmpty()
  externalId: string

}

export class DriverIdDto {

  @IsOptional()
  driverId: string

}
