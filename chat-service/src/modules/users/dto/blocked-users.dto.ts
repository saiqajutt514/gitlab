import { IsNotEmpty, IsNumber } from 'class-validator';

export class BlockUnblockDto {
    @IsNotEmpty()
    @IsNumber()
    userId: number;

    @IsNotEmpty()
    @IsNumber()
    blockedId: number;
}
