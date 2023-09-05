import { Expose } from "class-transformer";
import { TransactionStatus, TripStatus, TripType } from "../trips.enum";

export class TripDetailSocket {
  @Expose()
  id: string

  @Expose()
  tripOtp: number

  @Expose()
  tripVerified: boolean

  @Expose()
  driverId: string

  @Expose()
  riderId: string

  @Expose()
  tripType: TripType

  @Expose()
  tripDistance: number

  @Expose()
  tripDistanceCovered: number

  @Expose()
  estimatedTripTime: number

  @Expose()
  tripTime: number

  @Expose()
  estimatedBaseAmount: number

  @Expose()
  tripBaseAmount: number

  @Expose()
  taxPercentage: number

  @Expose()
  taxAmount: number

  @Expose()
  waitingCharge: number

  @Expose()
  riderAmount: number

  @Expose()
  driverAmount: number

  @Expose()
  promoCode: string

  @Expose()
  promoCodeAmount: number

  @Expose()
  status: TripStatus

  @Expose()
  transactionStatus: TransactionStatus

  @Expose()
  riderScheduledAt: Date

  @Expose()
  driverAssignedAt: Date

  @Expose()
  driverReachedAt: Date

  @Expose()
  tripStartedAt: Date

  @Expose()
  tripFinishedAt: Date

  @Expose()
  motAmount: number
}