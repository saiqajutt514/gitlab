import { IsString, IsNotEmpty } from 'class-validator';

export class SaveSettingDto {

  @IsNotEmpty()
  @IsString()
  value: string

}