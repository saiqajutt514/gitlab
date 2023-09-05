import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import appConfig from 'config/appConfig';
import { errorMessage } from 'src/constants/error-message-constant';
import { LoggerHandler } from 'src/helpers/logger-handler';
import { ResponseData } from 'transportation-common/dist/helpers/responseHandler';
import { Repository } from 'typeorm';
import { CreateIbanDto } from './dto/create-iban.dto';
import { UpdateIbanDto } from './dto/update-iban.dto';
import { IbanEntity } from './entities/iban.entity';

@Injectable()
export class IbanService {
  constructor(
    @InjectRepository(IbanEntity)
    private IbanRepository: Repository<IbanEntity>,
  ) {}
  private readonly logger = new LoggerHandler(IbanService.name).getInstance();
  async create(params: CreateIbanDto) {
    try {
      const regexp = new RegExp('^SA|^sa|^Sa|^sA');
      if (!regexp.test(params.iban)) {
        return ResponseData.error(
          HttpStatus.BAD_REQUEST,
          errorMessage.NON_KSA_IBAN,
        );
      }
      this.logger.log('[create] start -> params:' + JSON.stringify(params));
      const ibanData = await this.findOne(params.iban);
      let result;
      if (ibanData.statusCode == HttpStatus.OK) {
        this.logger.log(`[createIban] result fetched from db`);
        return ibanData;
      } else {
        this.logger.log(`[createIban] result fetching start from api `);
        const axiosConfig = {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json;charset=UTF-8',
          },
          // proxy: {
          //   host: appConfig().proxyHost,
          //   port: appConfig().proxyPort,
          // },
        };
        const requestUri = `?api_key=${appConfig().ibanKey}&format=json&iban=${
          params.iban
        }`;
        const apiUrl = appConfig().ibanApiUrl;

        this.logger.log(`[create] apiUrl: ${apiUrl}`);
        this.logger.log(`[create] config: ${JSON.stringify(axiosConfig)}}`);

        const apiRes = await axios.get(apiUrl + requestUri, axiosConfig);
        this.logger.log(`[create] api res: ${JSON.stringify(apiRes?.data)}`);
        if (
          apiRes.data?.validations?.iban?.code != '001' ||
          apiRes.data?.validations?.length?.code != '003'
        ) {
          return ResponseData.error(
            HttpStatus.BAD_REQUEST,
            errorMessage.INVALID_IBAN,
          );
        }
        const DBparams = {
          iban: params.iban,
          data: apiRes?.data,
          bank: apiRes?.data?.bank_data?.bank,
          bic: apiRes?.data?.bank_data?.bic,
        };
        const SaveToDB = this.IbanRepository.create(DBparams);
        await SaveToDB.save();
        result = apiRes.data;
        this.logger.log(`[createIban] result fetched from api`);
      }

      return ResponseData.success(result.bank_data);
    } catch (err) {
      this.logger.error(`[create] catch-> err: ${err.message}`);
      if (axios.isAxiosError(err)) {
        this.logger.error(
          `[create] -> Error in catch | create API message: ${JSON.stringify(
            err?.response?.data,
          )}`,
        );
      }
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async findOne(iban) {
    try {
      const ibanQuery = this.IbanRepository.createQueryBuilder('iban')
        .select(['iban.bank', 'iban.bic'])
        .where({ iban: iban });
      const ibanData = await ibanQuery.getOne();
      if (ibanData?.bank) return ResponseData.success(ibanData);
      else return ResponseData.error(HttpStatus.NOT_FOUND);
    } catch (err) {
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }
}
