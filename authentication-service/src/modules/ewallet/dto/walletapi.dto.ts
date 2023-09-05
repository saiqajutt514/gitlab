import { IsNotEmpty, IsOptional } from 'class-validator';

export class WalletApiDto {
  @IsNotEmpty()
  sessionId: string;

  @IsOptional()
  syncData: boolean;

  @IsOptional()
  returnRaw: boolean;

  @IsOptional()
  userId: string;
}

export class CarInfoDto {
  @IsNotEmpty()
  sequenceNumber: string;
}
