import { Expose } from "class-transformer";

export class CabTypeAdmin {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  nameArabic: string;

  @Expose()
  description: string;

  @Expose()
  descriptionArabic: string;

  @Expose()
  passengerBaseFare: number;

  @Expose()
  passengerCostPerMin: number;

  @Expose()
  passengerCostPerKm: number;

  @Expose()
  waitChargePerMin: number;

  @Expose()
  categoryIcon: string;

  @Expose()
  noOfSeats: number;

  @Expose()
  status: number;

  @Expose()
  order: number;
}
