import { Exclude, Expose } from "class-transformer";
import { IsString } from "class-validator";

export class CarInfoResponseDto {
  @Expose()
  @IsString()
  chassisNumber: string

  @Expose()
  cylinders: number

  @Expose()
  lkVehicleClass: number

  @Expose()
  @IsString()
  majorColor: string

  @Expose()
  modelYear: number

  @Expose()
  @IsString()
  ownerName: string

  @Expose()
  plateNumber: number

  @Expose()
  @IsString()
  plateText1: string

  @Expose()
  @IsString()
  plateText2: string

  @Expose()
  @IsString()
  plateText3: string

  @Expose()
  plateTypeCode: number

  @Expose()
  @IsString()
  regPlace: string

  @Expose()
  vehicleCapacity: number

  @Expose()
  @IsString()
  vehicleMaker: string

  @Expose()
  @IsString()
  vehicleModel: string

  @Expose()
  @IsString()
  licenseExpiryDate: string

  @Expose()
  @IsString()
  bodyType: string

  @Exclude()
  @IsString()
  sequenceNumber: number
}
