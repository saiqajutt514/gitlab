import { PartialType } from '@nestjs/mapped-types';
import { CreateSubscriptionDto } from '../../admin/dto/create-subscription.dto';

export class UpdateSubscriptionDto extends PartialType(CreateSubscriptionDto) {}
