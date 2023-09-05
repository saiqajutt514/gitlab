import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class UpdateEmergencyRequestDto {

  @IsString()
  @IsOptional()
  modifiedBy: string

  @IsNumber()
  @IsNotEmpty()
  tripStatus: number

  @IsNumber()
  @IsNotEmpty()
  issueStatus: number

}

export class ResolveEmergencyRequestDto {

  @IsString()
  @IsNotEmpty()
  remarks: string

  @IsString()
  @IsOptional()
  resolvedBy: string

  @IsString()
  @IsOptional()
  modifiedBy: string

  @IsString()
  @IsOptional()
  resolvedAt: string;

  @IsNumber()
  @IsNotEmpty()
  tripStatus: number

  @IsNumber()
  @IsNotEmpty()
  issueStatus: number

}
