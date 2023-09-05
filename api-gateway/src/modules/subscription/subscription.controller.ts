import { Controller, Get, Param, Req, Put } from '@nestjs/common';
import { ResponseHandler } from 'src/helpers/responseHandler';

import { SubscriptionService } from './subscription.service';

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) { }

  @Get()
  async findAll() {
    const response = await this.subscriptionService.findAll();
    return ResponseHandler(response)
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const response = await this.subscriptionService.findOne(id);
    return ResponseHandler(response)
  }
}
