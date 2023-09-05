import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, Transport } from "@nestjs/microservices";
import { LoggerHandler } from 'src/helpers/logger-handler';
import {PagesService} from './pages.service'
import {ADD_SLA_CONTENT, GET_SLA_CONTENT, UPDATE_SLA_CONTENT} from '../../constants/kafka-constant'
import { ListSortDto } from './dto/pages.dto';

@Controller('pages')
export class PagesController {
    private readonly logger = new LoggerHandler(PagesController.name).getInstance();
  constructor(private pagesService: PagesService) { }

  @MessagePattern(GET_SLA_CONTENT, Transport.TCP)
  async getSLAContent(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.debug(`tcp::get-terms-conditions::${GET_SLA_CONTENT}::recv -> ${JSON.stringify(message.value)}`);
    return await this.pagesService.findAll(message.value);
  }
  @MessagePattern(ADD_SLA_CONTENT, Transport.TCP)
  async addSLAContent(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.debug(`tcp::add-terms-conditions::${ADD_SLA_CONTENT}::recv -> ${JSON.stringify(message.value)}`);
    return await this.pagesService.addSLAContent(message.value);
  }
  @MessagePattern(UPDATE_SLA_CONTENT, Transport.TCP)
  async updateSLAContent(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(`tcp::update-terms-conditions::${UPDATE_SLA_CONTENT}::recv -> ${JSON.stringify(message.value)}`);
    return await this.pagesService.updateSLAContent(message.value);
  }
}
