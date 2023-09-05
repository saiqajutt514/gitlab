import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateEmergencyRequestDto {

  @IsString()
  @IsNotEmpty()
  trip: string

  @IsString()
  @IsNotEmpty()
  reason: string

  @IsString()
  @IsOptional()
  comments: string

  @IsString()
  @IsOptional()
  location: string

  @IsNumber()
  @IsOptional()
  latitude: number

  @IsNumber()
  @IsOptional()
  longitude: number

  @IsNumber()
  @IsOptional()
  rider: string

}
