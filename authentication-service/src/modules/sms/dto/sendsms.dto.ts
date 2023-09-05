import { IsNotEmpty,IsString, IsNumber, MinLength, MaxLength } from 'class-validator';

export class sendSms {

    @MinLength(12)
    @MaxLength(12)
    @IsNotEmpty()
    @IsNumber()
    mobileNo: number;

    @IsNotEmpty()
    @IsString()
    message: string;
}
