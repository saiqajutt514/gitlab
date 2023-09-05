import { IsString, IsOptional, IsNotEmpty, IsBoolean } from 'class-validator';

export class ApproveCaptainDto {

  @IsOptional()
  @IsBoolean()
  approved: boolean

}


export class RejectCaptainDto {

  @IsNotEmpty()
  @IsString()
  blockedReason: string;

  @IsOptional()
  blockedDate: string;

  @IsOptional()
  approved: boolean

}

