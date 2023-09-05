import { PartialType } from '@nestjs/mapped-types';
import { CreateClickPayDto } from './click-pay.dto';

export class UpdateClickPayDto extends PartialType(CreateClickPayDto) {
  id: number;
}
