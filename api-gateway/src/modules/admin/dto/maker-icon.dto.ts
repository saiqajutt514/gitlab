import { IsString, IsOptional } from 'class-validator';

export class MakerIcon {
  @IsString()
  @IsOptional()
  makerIcon: string;
}
