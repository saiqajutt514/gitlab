import { IsNotEmpty, IsString } from 'class-validator';
export class QRGeneratorDto {
  @IsNotEmpty()
  @IsString()
  seller?: string;

  @IsNotEmpty()
  @IsString()
  vatNo?: string;

  @IsNotEmpty()
  @IsString()
  dateTime?: string;

  @IsNotEmpty()
  @IsString()
  invoiceTotal: string;

  @IsNotEmpty()
  vatTotal: string;
}
