import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { IbanService } from './iban.service';
import { CreateIbanDto } from './dto/create-iban.dto';
import { UpdateIbanDto } from './dto/update-iban.dto';

@Controller()
export class IbanController {
  constructor(private readonly ibanService: IbanService) {}

  @MessagePattern('createIban')
  create(@Payload() createIbanDto) {
    console.debug(createIbanDto);
    return this.ibanService.create(JSON.parse(createIbanDto).param);
  }

  @MessagePattern('findOneIban')
  findOne(@Payload() id: number) {
    return this.ibanService.findOne(id);
  }
}
