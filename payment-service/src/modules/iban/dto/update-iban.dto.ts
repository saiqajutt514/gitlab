import { PartialType } from '@nestjs/mapped-types';
import { CreateIbanDto } from './create-iban.dto';

export class UpdateIbanDto extends PartialType(CreateIbanDto) {
  id: number;
}
