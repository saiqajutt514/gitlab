import { IsNumber, IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class SaveReviewDto {

  @IsString()
  @IsNotEmpty()
  externalId: string;

  @IsNumber()
  @IsNotEmpty()
  externalType: number;

  @IsOptional()
  @IsString()
  externalIdFor: string;

  @IsOptional()
  @IsString()
  externalIdBy: string;

  @IsOptional()
  @IsString()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsNumber()
  rating: number

  @IsOptional()
  @IsString()
  answers: string

}