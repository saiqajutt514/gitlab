import { Injectable, HttpStatus } from '@nestjs/common';
import appConfig from 'config/appConfig';
import { LoggerHandler } from 'src/helpers/logger-handler';
import { ResponseHandler } from 'src/helpers/responseHandler';
import { errorMessage } from 'src/constants/error-message-constant';
import axios from 'axios';
import {
  CarInfoDto,
  getAlienAddressInfoByIqamaDto,
  getAlienDLInfoByIqamaDto,
  getCitizenDLInfoDto,
  getCitizenAddressInfoDto,
  getCitizenInfo2Dto,
  getAlienInfoByIqama2Dto,
} from './dto/yakeen.dto';
import { CarInfoBySequence } from './entities/CarInfoBySequence.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { getAlienAddressInfoByIqama } from './entities/getAlienAddressInfoByIqama.entity';
import { getAlienDLInfoByIqama } from './entities/getAlienDLInfoByIqama.entity';
import { getCitizenAddressInfo } from './entities/getCitizenAddressInfo.entity';
import { getCitizenDLInfo } from './entities/getCitizenDLInfo.entity';
import { getAlienInfoByIqama2 } from './entities/getAlienInfoByIqama2.entity';
import { getCitizenInfo2 } from './entities/getCitizenInfo2.entity';

@Injectable()
export class YakeenService {
  constructor(
    @InjectRepository(CarInfoBySequence)
    private CarInfoBySequenceRepository: Repository<CarInfoBySequence>,

    @InjectRepository(getAlienAddressInfoByIqama)
    private getAlienAddressInfoByIqamaRepository: Repository<getAlienAddressInfoByIqama>,

    @InjectRepository(getAlienDLInfoByIqama)
    private getAlienDLInfoByIqamaRepository: Repository<getAlienDLInfoByIqama>,

    @InjectRepository(getCitizenAddressInfo)
    private getCitizenAddressInfoRepository: Repository<getCitizenAddressInfo>,

    @InjectRepository(getCitizenDLInfo)
    private getCitizenDLInfoRepository: Repository<getCitizenDLInfo>,

    @InjectRepository(getCitizenInfo2)
    private getCitizenInfo2Repository: Repository<getCitizenInfo2>,

    @InjectRepository(getAlienInfoByIqama2)
    private getAlienInfoByIqama2Repository: Repository<getAlienInfoByIqama2>,
  ) {}

  private readonly logger = new LoggerHandler(YakeenService.name).getInstance();

  private xmlToJsonConverter = require('xml-js');
  private readonly xmlToJsonOptions = {
    compact: true,
    ignoreComment: true,
    spaces: 0,
    ignoreAttributes: true,
    ignoreInstruction: true,
    ignoreCdata: true,
    ignoreDoctype: true,
    ignoreDeclaration: true,
    instructionHasAttributes: true,
    nativeTypeAttributes: true,
    nativeType: true,
  };

  private readonly apiUrl = appConfig().yakeenApiUrl;
  private readonly apiUsername = appConfig().yakeenUsername;
  private readonly apiPassword = appConfig().yakeenPassword;
  private readonly apiChargeCode = appConfig().yakeenChargecode;

  private readonly axiosConfig = {
    headers: {
      'Content-Type': 'text/xml',
    },
  };

  async CarInfoBySequence(params: CarInfoDto) {
    try {
      this.logger.log(
        `["CarInfoBySequence"] -> params: ${JSON.stringify(params)}`,
      );

      this.logger.log(`["CarInfoBySequence"] -> LOCAL SEARCH START`);
      let result, YakeenDB, YakeenRow;
      if (appConfig().mode === 'dev') {
        YakeenDB = this.CarInfoBySequenceRepository.createQueryBuilder(
          'CarInfoBySequence',
        );
        YakeenDB.where({ sequenceNumber: parseInt(params.sequenceNumber) });
        YakeenRow = await YakeenDB.getOne();
      }
      // let apiRes;
      // let result;
      if (YakeenRow?.id) {
        this.logger.log(
          `["CarInfoBySequence"] -> LOCAL SEARCH Data found: ${YakeenRow.data}`,
        );

        if (YakeenRow?.userid != parseInt(params.userid)) {
          this.logger.error(
            `["CarInfoBySequence"] -> LOCAL SEARCH Data found but id not matched with sequence number`,
          );
          return ResponseHandler.error(
            HttpStatus.NOT_ACCEPTABLE,
            this.yakeenErrorCodetoHttpCode('14').message,
          );
        }
        result = YakeenRow.data;
      } else {
        const RequestXml = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:yak="http://yakeen4ride.yakeen.elm.com/">
                    <soapenv:Header/>
                    <soapenv:Body>
                    <yak:getCarInfoBySequence>
                        <!--Optional:-->
                        <CarInfoBySequenceRequest>
                            <!--Optional:-->
                            <chargeCode>${this.apiChargeCode}</chargeCode>
                            <ownerId>${params.userid}</ownerId>
                            <!--Optional:-->
                            <password>${this.apiPassword}</password>
                            <!--Optional:-->
                            <referenceNumber>?</referenceNumber>
                            <sequenceNumber>${params.sequenceNumber}</sequenceNumber>
                            <!--Optional:-->
                            <userName>${this.apiUsername}</userName>
                        </CarInfoBySequenceRequest>
                    </yak:getCarInfoBySequence>
                    </soapenv:Body>
                </soapenv:Envelope>`;

        //this.logger.log(`["CarInfoBySequence"] -> params: ${RequestXml}`);

        const apiRes = await axios.post(
          this.apiUrl,
          RequestXml,
          this.axiosConfig,
        );

        this.logger.log(
          `["CarInfoBySequence"] -> Yakeen api response: ${apiRes.data}`,
        );

        result = this.xmlToJsonConverter.xml2json(
          apiRes.data,
          this.xmlToJsonOptions,
        );

        this.logger.log(`["CarInfoBySequence"] -> DB entry start`);
        const DBparams = {
          sequenceNumber: parseInt(params?.sequenceNumber),
          data: result,
          userid: parseInt(params?.userid),
        };
        try {
          const SaveToDB = this.CarInfoBySequenceRepository.create(DBparams);
          const DBresponse = await SaveToDB.save();

          if (DBresponse?.id) {
            this.logger.log(
              `["CarInfoBySequence"] -> Yakeen Response saved to DB`,
            );
          }
        } catch (err) {}
      }
      if (!result['soap:Envelope']) result = JSON.parse(result);
      result =
        result['soap:Envelope']['soap:Body'][
          'ns1:getCarInfoBySequenceResponse'
        ]['CarInfoBySequenceResult'];

      if (Number(result?.modelYear?._text)) {
      }
      const carinfo = {
        carSequenceNo: params.sequenceNumber,
        majorColor: result?.majorColor?._text,
        modelYear: result?.modelYear?._text,
        ownerName: result?.ownerName?._text,
        plateNumber: result?.plateNumber?._text,
        plateText1: this.vehiclePlateLettersConvertArToAr(
          result?.plateText1?._text,
        ),
        plateText2: this.vehiclePlateLettersConvertArToAr(
          result?.plateText2?._text,
        ),
        plateText3: this.vehiclePlateLettersConvertArToAr(
          result?.plateText3?._text,
        ),
        plateText1English: this.vehiclePlateLettersConvertArToEn(
          result?.plateText1?._text,
        ),
        plateText2English: this.vehiclePlateLettersConvertArToEn(
          result?.plateText2?._text,
        ),
        plateText3English: this.vehiclePlateLettersConvertArToEn(
          result?.plateText3?._text,
        ),
        plateTypeCode: result?.plateTypeCode?._text,
        vehicleMaker: result?.vehicleMaker?._text,
        vehicleModel: result?.vehicleModel?._text,
      };
      return ResponseHandler.success(carinfo);
    } catch (err) {
      try {
        this.logger.error(
          `[CarInfoBySequence] -> Error in catch: ${err.message}`,
        );
        // console.log(err)

        if (axios.isAxiosError(err)) {
          this.logger.error(
            `[CarInfoBySequence] -> Error in catch | CarInfoBySequence API message: ${JSON.stringify(
              err?.response?.data,
            )}`,
          );

          let result = this.xmlToJsonConverter.xml2json(
            err?.response?.data,
            this.xmlToJsonOptions,
          );
          result = JSON.parse(result)['soap:Envelope']['soap:Body'][
            'soap:Fault'
          ]['faultstring']?._text;
          return ResponseHandler.error(
            err.response?.status || HttpStatus.BAD_REQUEST,
            result ||
              err.response?.data?.message ||
              errorMessage.SOMETHING_WENT_WRONG,
          );
        }
      } catch (err) {
        return ResponseHandler.error(
          HttpStatus.BAD_REQUEST,
          errorMessage.SOMETHING_WENT_WRONG,
        );
      }
      return ResponseHandler.error(
        HttpStatus.BAD_REQUEST,
        err?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async getCitizenAddressInfo(params: getCitizenAddressInfoDto) {
    try {
      this.logger.log(
        `["getCitizenAddressInfo"] -> params: ${JSON.stringify(params)}`,
      );
      this.logger.log(`["getCitizenAddressInfo"] -> LOCAL SEARCH START`);
      let result, YakeenDB, YakeenRow;
      if (appConfig().mode === 'dev') {
        YakeenDB = this.getCitizenAddressInfoRepository.createQueryBuilder(
          'getCitizenAddressInfo',
        );
        YakeenDB.where({
          userid: parseInt(params.userid),
          language: params.language,
        });
        YakeenRow = await YakeenDB.getOne();
      }
      // let result;
      if (YakeenRow?.id) {
        this.logger.log(
          `["getCitizenAddressInfo"] -> LOCAL SEARCH Data found: ${YakeenRow.data}`,
        );

        if (YakeenRow?.dateOfBirth != params.dateOfBirth) {
          this.logger.error(
            `["getCitizenAddressInfo"] -> LOCAL SEARCH Data found but id not matched with sequence number`,
          );
          return ResponseHandler.error(
            HttpStatus.NOT_ACCEPTABLE,
            this.yakeenErrorCodetoHttpCode('18').message,
          );
        }
        result = YakeenRow.data;
      } else {
        const RequestXml = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:yak="http://yakeen4ride.yakeen.elm.com/">
                <soapenv:Header/>
                    <soapenv:Body>
                    <yak:getCitizenAddressInfo>
                        <!--Optional:-->
                        <CitizenAddressInfoRequest>
                            <!--Optional:-->
                            <addressLanguage>${params.language}</addressLanguage>
                            <!--Optional:-->
                            <chargeCode>${this.apiChargeCode}</chargeCode>
                            <!--Optional:-->
                            <dateOfBirth>${params.dateOfBirth}</dateOfBirth>
                            <!--Optional:-->
                            <nin>${params.userid}</nin>
                            <!--Optional:-->
                            <password>${this.apiPassword}</password>
                            <!--Optional:-->
                            <referenceNumber>?</referenceNumber>
                            <!--Optional:-->
                            <userName>${this.apiUsername}</userName>
                        </CitizenAddressInfoRequest>
                    </yak:getCitizenAddressInfo>
                    </soapenv:Body>
                </soapenv:Envelope>`;

        //this.logger.log(`["getCitizenAddressInfo"] -> params: ${RequestXml}`);

        const apiRes = await axios.post(
          this.apiUrl,
          RequestXml,
          this.axiosConfig,
        );

        this.logger.log(
          `["getCitizenAddressInfo"] -> Yakeen api response: ${apiRes.data}`,
        );

        result = this.xmlToJsonConverter.xml2json(
          apiRes.data,
          this.xmlToJsonOptions,
        );
        this.logger.log(`["getCitizenAddressInfo"] -> DB entry start`);
        const DBparams = {
          dateOfBirth: params?.dateOfBirth,
          data: result,
          userid: parseInt(params?.userid),
          language: params.language,
        };
        try {
          const SaveToDB = this.getCitizenAddressInfoRepository.create(
            DBparams,
          );
          const DBresponse = await SaveToDB.save();

          if (DBresponse?.id) {
            this.logger.log(
              `["getCitizenAddressInfo"] -> Yakeen Response saved to DB`,
            );
          }
        } catch (err) {}
      }
      if (!result['soap:Envelope']) result = JSON.parse(result);
      result =
        result['soap:Envelope']['soap:Body'][
          'ns1:getCitizenAddressInfoResponse'
        ]['CitizenAddressInfoResult'];

      // console.log(result);

      // result = JSON.parse(result)['soap:Envelope']['soap:Body'][
      //   'ns1:getCitizenAddressInfoResponse'
      // ]['CitizenAddressInfoResult']; //.map( function(obj){ return obj?._text })
      // console.log(result)
      if (Array.isArray(result?.addressListList))
        result = result?.addressListList[0];
      else result = result?.addressListList;
      const CitizenAddressInfo = {
        additionalNumber: result?.additionalNumber?._text,
        buildingNumber: result?.buildingNumber?._text,
        city: result?.city?._text,
        district: result?.district?._text,
        locationCoordinates: result?.locationCoordinates?._text,
        postCode: result?.postCode?._text,
        streetName: result?.streetName?._text,
        unitNumber: result?.unitNumber?._text,
        completeInfo: result,
      };
      return ResponseHandler.success(CitizenAddressInfo);
    } catch (err) {
      try {
        this.logger.error(
          `[getCitizenAddressInfo] -> Error in catch: ${err.message}`,
        );
        // console.log(err)

        if (axios.isAxiosError(err)) {
          this.logger.error(
            `[getCitizenAddressInfo] -> Error in catch | getCitizenAddressInfo API message: ${JSON.stringify(
              err?.response?.data,
            )}`,
          );

          let result = this.xmlToJsonConverter.xml2json(
            err?.response?.data,
            this.xmlToJsonOptions,
          );
          result = JSON.parse(result)['soap:Envelope']['soap:Body'][
            'soap:Fault'
          ]['faultstring']?._text;
          return ResponseHandler.error(
            err.response?.status || HttpStatus.BAD_REQUEST,
            result ||
              err.response?.data?.message ||
              errorMessage.SOMETHING_WENT_WRONG,
          );
        }
      } catch (err) {
        return ResponseHandler.error(
          HttpStatus.BAD_REQUEST,
          errorMessage.SOMETHING_WENT_WRONG,
        );
      }
      return ResponseHandler.error(
        HttpStatus.BAD_REQUEST,
        err?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async getAlienAddressInfoByIqama(params: getAlienAddressInfoByIqamaDto) {
    try {
      this.logger.log(
        `["getAlienAddressInfoByIqama"] -> params: ${JSON.stringify(params)}`,
      );
      this.logger.log(`["getAlienAddressInfoByIqama"] -> LOCAL SEARCH START`);
      let result, YakeenDB, YakeenRow;
      if (appConfig().mode === 'dev') {
        YakeenDB = this.getAlienAddressInfoByIqamaRepository.createQueryBuilder(
          'getAlienAddressInfoByIqama',
        );
        YakeenDB.where({
          iqamaNumber: parseInt(params.iqamaNumber),
          language: params.language,
        });
        YakeenRow = await YakeenDB.getOne();
      }
      // let result;
      if (YakeenRow?.id) {
        this.logger.log(
          `["getAlienAddressInfoByIqama"] -> LOCAL SEARCH Data found: ${YakeenRow.data}`,
        );

        if (YakeenRow?.dateOfBirth != params.dateOfBirth) {
          this.logger.error(
            `["getAlienAddressInfoByIqama"] -> LOCAL SEARCH Data found but id not matched with sequence number`,
          );
          return ResponseHandler.error(
            HttpStatus.NOT_ACCEPTABLE,
            this.yakeenErrorCodetoHttpCode('18').message,
          );
        }
        result = YakeenRow.data;
      } else {
        const RequestXml = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:yak="http://yakeen4ride.yakeen.elm.com/">
                    <soapenv:Header/>
                        <soapenv:Body>
                        <yak:getAlienAddressInfoByIqama>
                            <!--Optional:-->
                            <AlienAddressInfoByIqamaRequest>
                                <!--Optional:-->
                                <addressLanguage>${params.language}</addressLanguage>
                                <!--Optional:-->
                                <chargeCode>${this.apiChargeCode}</chargeCode>
                                <!--Optional:-->
                                <dateOfBirth>${params.dateOfBirth}</dateOfBirth>
                                <!--Optional:-->
                                <iqamaNumber>${params.iqamaNumber}</iqamaNumber>
                                <!--Optional:-->
                                <password>${this.apiPassword}</password>
                                <!--Optional:-->
                                <referenceNumber>?</referenceNumber>
                                <!--Optional:-->
                                <userName>${this.apiUsername}</userName>
                            </AlienAddressInfoByIqamaRequest>
                        </yak:getAlienAddressInfoByIqama>
                        </soapenv:Body>
                </soapenv:Envelope>`;

        //this.logger.log(`["getCitizenInfo"] -> params: ${RequestXml}`);

        const apiRes = await axios.post(
          this.apiUrl,
          RequestXml,
          this.axiosConfig,
        );

        this.logger.log(
          `["getAlienAddressInfoByIqama"] -> Yakeen api response: ${apiRes.data}`,
        );

        result = this.xmlToJsonConverter.xml2json(
          apiRes.data,
          this.xmlToJsonOptions,
        );

        this.logger.log(`["getAlienAddressInfoByIqama"] -> DB entry start`);
        const DBparams = {
          iqamaNumber: parseInt(params?.iqamaNumber),
          data: result,
          dateOfBirth: params.dateOfBirth,
          language: params.language,
        };
        try {
          const SaveToDB = this.getAlienAddressInfoByIqamaRepository.create(
            DBparams,
          );
          const DBresponse = await SaveToDB.save();

          if (DBresponse?.id) {
            this.logger.log(
              `["getAlienAddressInfoByIqama"] -> Yakeen Response saved to DB`,
            );
          }
        } catch (err) {}
      }
      if (!result['soap:Envelope']) result = JSON.parse(result);

      result =
        result['soap:Envelope']['soap:Body'][
          'ns1:getAlienAddressInfoByIqamaResponse'
        ]['AlienAddressInfoByIqamaResult'];
      console.log(result);
      if (Array.isArray(result?.addressListList))
        result = result?.addressListList[0];
      else result = result?.addressListList;
      const AlienInfo = {
        additionalNumber: result?.additionalNumber?._text,
        buildingNumber: result?.buildingNumber?._text,
        city: result?.city?._text,
        district: result?.district?._text,
        locationCoordinates: result?.locationCoordinates?._text,
        postCode: result?.postCode?._text,
        streetName: result?.streetName?._text,
        unitNumber: result?.unitNumber?._text,
        completeInfo: result,
      };
      return ResponseHandler.success(AlienInfo);
    } catch (err) {
      try {
        this.logger.error(
          `[getAlienAddressInfoByIqama] -> Error in catch: ${err.message}`,
        );
        // console.log(err)

        if (axios.isAxiosError(err)) {
          this.logger.error(
            `[getAlienAddressInfoByIqama] -> Error in catch | getAlienAddressInfoByIqama API message: ${JSON.stringify(
              err?.response?.data,
            )}`,
          );

          let result = this.xmlToJsonConverter.xml2json(
            err?.response?.data,
            this.xmlToJsonOptions,
          );
          result = JSON.parse(result)['soap:Envelope']['soap:Body'][
            'soap:Fault'
          ]['faultstring']?._text;
          return ResponseHandler.error(
            err.response?.status || HttpStatus.BAD_REQUEST,
            result ||
              err.response?.data?.message ||
              errorMessage.SOMETHING_WENT_WRONG,
          );
        }
      } catch (err) {
        return ResponseHandler.error(
          HttpStatus.BAD_REQUEST,
          errorMessage.SOMETHING_WENT_WRONG,
        );
      }
      return ResponseHandler.error(
        HttpStatus.BAD_REQUEST,
        err?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async getAlienDLInfoByIqama(params: getAlienDLInfoByIqamaDto) {
    try {
      this.logger.log(
        `["getAlienDLInfoByIqama"] -> params: ${JSON.stringify(params)}`,
      );

      this.logger.log(`["getAlienDLInfoByIqama"] -> LOCAL SEARCH START`);
      let result, YakeenDB, YakeenRow;
      if (appConfig().mode === 'dev') {
        YakeenDB = this.getAlienDLInfoByIqamaRepository.createQueryBuilder(
          'getAlienDLInfoByIqama',
        );
        YakeenDB.where({ iqamaNumber: parseInt(params.iqamaNumber) });
        YakeenRow = await YakeenDB.getOne();
      }
      if (YakeenRow?.id) {
        this.logger.log(
          `["getAlienDLInfoByIqama"] -> LOCAL SEARCH Data found: ${YakeenRow.data}`,
        );

        if (YakeenRow?.licssExpiryDateG != params.licssExpiryDateG) {
          this.logger.error(
            `["getAlienDLInfoByIqama"] -> LOCAL SEARCH Data found but id not matched with sequence number`,
          );
          return ResponseHandler.error(
            HttpStatus.NOT_ACCEPTABLE,
            this.yakeenErrorCodetoHttpCode('5').message,
          );
        }
        result = YakeenRow.data;
      } else {
        const RequestXml = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:yak="http://yakeen4ride.yakeen.elm.com/">
                <soapenv:Header/>
                <soapenv:Body>
                   <yak:getAlienDLInfoByIqama>
                      <!--Optional:-->
                      <AlienDLInfoByIqamaRequest>
                         <!--Optional:-->
                         <chargeCode>${this.apiChargeCode}</chargeCode>
                         <!--Optional:-->
                         <iqamaNumber>${params.iqamaNumber}</iqamaNumber>
                         <!--Optional:-->
                         <licssExpiryDateG>${params.licssExpiryDateG}</licssExpiryDateG>
                         <!--Optional:-->
                         <password>${this.apiPassword}</password>
                         <!--Optional:-->
                         <referenceNumber>?</referenceNumber>
                         <!--Optional:-->
                         <userName>${this.apiUsername}</userName>
                      </AlienDLInfoByIqamaRequest>
                   </yak:getAlienDLInfoByIqama>
                </soapenv:Body>
             </soapenv:Envelope>`;

        //this.logger.log(`["getAlienDLInfoByIqama"] -> params: ${RequestXml}`);

        const apiRes = await axios.post(
          this.apiUrl,
          RequestXml,
          this.axiosConfig,
        );

        this.logger.log(
          `["getAlienDLInfoByIqama"] -> Yakeen api response: ${apiRes.data}`,
        );

        result = this.xmlToJsonConverter.xml2json(
          apiRes.data,
          this.xmlToJsonOptions,
        );

        this.logger.log(`["getAlienDLInfoByIqama"] -> DB entry start`);
        const DBparams = {
          licssExpiryDateG: params?.licssExpiryDateG,
          data: result,
          iqamaNumber: parseInt(params?.iqamaNumber),
        };
        try {
          const SaveToDB = this.getAlienDLInfoByIqamaRepository.create(
            DBparams,
          );
          const DBresponse = await SaveToDB.save();

          if (DBresponse?.id) {
            this.logger.log(
              `["getAlienDLInfoByIqama"] -> Yakeen Response saved to DB`,
            );
          }
        } catch (err) {}
      }
      if (!result['soap:Envelope']) result = JSON.parse(result);
      result =
        result['soap:Envelope']['soap:Body'][
          'ns1:getAlienDLInfoByIqamaResponse'
        ]['AlienDLInfoByIqamaResult']; //.map( function(obj){ return obj?._text })
      // console.log(result)
      const AlienDLInfoByIqama = {
        firstName: result?.firstName?._text,
        secondName: result?.secondName?._text,
        thirdName: result?.thirdName?._text,
        lastName: result?.lastName?._text,
        englishFirstName: result?.englishFirstName?._text,
        englishSecondName: result?.englishSecondName?._text,
        englishThirdName: result?.englishThirdName?._text,
        englishLastName: result?.englishLastName?._text,
        dateOfBirthG: result?.dateOfBirthG?._text,
        iqamaExpiryDateG: result?.iqamaExpiryDateG?._text,
        iqamaExpiryDateH: result?.iqamaExpiryDateH?._text,
        gender: result?.gender?._text,
        occupationCode: result?.occupationCode?._text,
        licensesListList: {
          licnsTypeCode: result?.licensesListList?.licnsTypeCode?._text,
          licssExpiryDateG: result?.licensesListList?.licssExpiryDateG?._text,
          licssExpiryDateH: result?.licensesListList?.licssExpiryDateH?._text,
        },
      };
      return ResponseHandler.success(AlienDLInfoByIqama);
    } catch (err) {
      try {
        this.logger.error(
          `[getAlienDLInfoByIqama] -> Error in catch: ${err.message}`,
        );
        // console.log(err)

        if (axios.isAxiosError(err)) {
          this.logger.error(
            `[getAlienDLInfoByIqama] -> Error in catch | getAlienDLInfoByIqama API message: ${JSON.stringify(
              err?.response?.data,
            )}`,
          );

          let result = this.xmlToJsonConverter.xml2json(
            err?.response?.data,
            this.xmlToJsonOptions,
          );
          result = JSON.parse(result)['soap:Envelope']['soap:Body'][
            'soap:Fault'
          ]['faultstring']?._text;
          return ResponseHandler.error(
            err.response?.status || HttpStatus.BAD_REQUEST,
            result ||
              err.response?.data?.message ||
              errorMessage.SOMETHING_WENT_WRONG,
          );
        }
      } catch (err) {
        return ResponseHandler.error(
          HttpStatus.BAD_REQUEST,
          errorMessage.SOMETHING_WENT_WRONG,
        );
      }
      return ResponseHandler.error(
        HttpStatus.BAD_REQUEST,
        err?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }
  async getAlienInfoByIqama2(params: getAlienInfoByIqama2Dto) {
    try {
      this.logger.log(
        `["getAlienInfoByIqama2"] -> params: ${JSON.stringify(params)}`,
      );

      this.logger.log(`["getAlienInfoByIqama2"] -> LOCAL SEARCH START`);
      let result, YakeenDB, YakeenRow;
      if (appConfig().mode === 'dev') {
        YakeenDB = this.getAlienInfoByIqama2Repository.createQueryBuilder(
          'getAlienInfoByIqama2',
        );
        YakeenDB.where({ iqamaNumber: params.iqamaNumber });
        YakeenRow = await YakeenDB.getOne();
      }
      // let result;
      if (YakeenRow?.id) {
        this.logger.log(
          `["getAlienInfoByIqama2"] -> LOCAL SEARCH Data found: ${YakeenRow.data}`,
        );

        if (YakeenRow?.dateOfBirth != params.dateOfBirth) {
          this.logger.error(
            `["getAlienInfoByIqama2"] -> LOCAL SEARCH Data found but id not matched with sequence number`,
          );
          return ResponseHandler.error(
            HttpStatus.NOT_ACCEPTABLE,
            this.yakeenErrorCodetoHttpCode('18').message,
          );
        }
        result = YakeenRow.data;
      } else {
        const RequestXml = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:yak="http://yakeen4ride.yakeen.elm.com/">
                        <soapenv:Header/>
                        <soapenv:Body>
                            <yak:getAlienInfoByIqama2>
                                <!--Optional:-->
                                <AlienInfoByIqama2Request>
                                    <!--Optional:-->
                                    <chargeCode>${this.apiChargeCode}</chargeCode>
                                    <!--Optional:-->
                                    <dateOfBirth>${params.dateOfBirth}</dateOfBirth>
                                    <!--Optional:-->
                                    <iqamaNumber>${params.iqamaNumber}</iqamaNumber>
                                    <!--Optional:-->
                                    <password>${this.apiPassword}</password>
                                    <!--Optional:-->
                                    <referenceNumber>?</referenceNumber>
                                    <!--Optional:-->
                                    <userName>${this.apiUsername}</userName>
                                </AlienInfoByIqama2Request>
                            </yak:getAlienInfoByIqama2>
                        </soapenv:Body>
                        </soapenv:Envelope>`;

        //this.logger.log(`["getAlienDLInfoByIqama"] -> params: ${RequestXml}`);

        const apiRes = await axios.post(
          this.apiUrl,
          RequestXml,
          this.axiosConfig,
        );

        this.logger.log(
          `["getAlienInfoByIqama2"] -> Yakeen api response: ${apiRes.data}`,
        );
        result = this.xmlToJsonConverter.xml2json(
          apiRes.data,
          this.xmlToJsonOptions,
        );

        this.logger.log(`["getAlienInfoByIqama2"] -> DB entry start`);
        const DBparams = {
          iqamaNumber: parseInt(params?.iqamaNumber),
          data: result,
          dateOfBirth: params.dateOfBirth,
        };
        try {
          const SaveToDB = this.getAlienInfoByIqama2Repository.create(DBparams);
          const DBresponse = await SaveToDB.save();

          if (DBresponse?.id) {
            this.logger.log(
              `["getAlienInfoByIqama2"] -> Yakeen Response saved to DB`,
            );
          }
        } catch (err) {}
      }
      if (!result['soap:Envelope']) result = JSON.parse(result);
      result =
        result['soap:Envelope']['soap:Body'][
          'ns1:getAlienInfoByIqama2Response'
        ]['AlienInfoByIqama2Result'];
      const AlienDLInfoByIqama = {
        firstName: result?.firstName?._text,
        secondName: result?.secondName?._text,
        thirdName: result?.thirdName?._text,
        lastName: result?.lastName?._text,
        englishFirstName: result?.englishFirstName?._text,
        englishSecondName: result?.englishSecondName?._text,
        englishThirdName: result?.englishThirdName?._text,
        englishLastName: result?.englishLastName?._text,
        dateOfBirthG: result?.dateOfBirthG?._text,
        idExpiryDate: result?.iqamaExpiryDateG?._text,
        iqamaExpiryDateG: result?.iqamaExpiryDateG?._text,
        iqamaExpiryDateH: result?.iqamaExpiryDateH?._text,
        nationalityCode: result?.nationalityCode?._text,
        occupationCode: result?.occupationCode?._text,
        gender: result?.gender?._text,
        completeInfo: result,
      };
      return ResponseHandler.success(AlienDLInfoByIqama);
    } catch (err) {
      try {
        this.logger.error(
          `[getAlienInfoByIqama2] -> Error in catch: ${err.message}`,
        );
        // console.log(err)

        if (axios.isAxiosError(err)) {
          this.logger.error(
            `[getAlienInfoByIqama2] -> Error in catch | getAlienInfoByIqama2 API message: ${JSON.stringify(
              err?.response?.data,
            )}`,
          );

          let result = this.xmlToJsonConverter.xml2json(
            err?.response?.data,
            this.xmlToJsonOptions,
          );
          result = JSON.parse(result)['soap:Envelope']['soap:Body'][
            'soap:Fault'
          ]['faultstring']?._text;
          return ResponseHandler.error(
            err.response?.status || HttpStatus.BAD_REQUEST,
            result ||
              err.response?.data?.message ||
              errorMessage.SOMETHING_WENT_WRONG,
          );
        }
      } catch (err) {
        return ResponseHandler.error(
          HttpStatus.BAD_REQUEST,
          errorMessage.SOMETHING_WENT_WRONG,
        );
      }
      return ResponseHandler.error(
        HttpStatus.BAD_REQUEST,
        err?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async getCitizenDLInfo(params: getCitizenDLInfoDto) {
    try {
      this.logger.log(
        `["getCitizenDLInfo"] -> params: ${JSON.stringify(params)}`,
      );

      this.logger.log(`["getCitizenDLInfo"] -> LOCAL SEARCH START`);
      let result, YakeenDB, YakeenRow;
      if (appConfig().mode === 'dev') {
        YakeenDB = this.getCitizenDLInfoRepository.createQueryBuilder(
          'getCitizenDLInfo',
        );
        YakeenDB.where({ userid: parseInt(params.userid) });

        YakeenRow = await YakeenDB.getOne();
      }
      // let result;
      if (YakeenRow?.id) {
        this.logger.log(
          `["getCitizenDLInfo"] -> LOCAL SEARCH Data found: ${YakeenRow.data}`,
        );

        if (YakeenRow?.licssExpiryDateH != params.licssExpiryDateH) {
          this.logger.error(
            `["getCitizenDLInfo"] -> LOCAL SEARCH Data found but id not matched with sequence number`,
          );
          return ResponseHandler.error(
            HttpStatus.NOT_ACCEPTABLE,
            this.yakeenErrorCodetoHttpCode('5').message,
          );
        }
        result = YakeenRow.data;
      } else {
        const RequestXml = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:yak="http://yakeen4ride.yakeen.elm.com/">
                        <soapenv:Header/>
                            <soapenv:Body>
                            <yak:getCitizenDLInfo>
                                <!--Optional:-->
                                <CitizenDLInfoRequest>
                                    <!--Optional:-->
                                    <chargeCode>${this.apiChargeCode}</chargeCode>
                                    <!--Optional:-->
                                    <licssExpiryDateH>${params.licssExpiryDateH}</licssExpiryDateH>
                                    <!--Optional:-->
                                    <nin>${params.userid}</nin>
                                    <!--Optional:-->
                                    <password>${this.apiPassword}</password>
                                    <!--Optional:-->
                                    <referenceNumber>?</referenceNumber>
                                    <!--Optional:-->
                                    <userName>${this.apiUsername}</userName>
                                </CitizenDLInfoRequest>
                            </yak:getCitizenDLInfo>
                            </soapenv:Body>
                </soapenv:Envelope>`;

        const apiRes = await axios.post(
          this.apiUrl,
          RequestXml,
          this.axiosConfig,
        );

        this.logger.log(
          `["getCitizenDLInfo"] -> Yakeen api response: ${apiRes.data}`,
        );

        result = this.xmlToJsonConverter.xml2json(
          apiRes.data,
          this.xmlToJsonOptions,
        );

        this.logger.log(`["getCitizenDLInfo"] -> DB entry start`);
        const DBparams = {
          userid: parseInt(params?.userid),
          data: result,
          licssExpiryDateH: params.licssExpiryDateH,
        };

        try {
          const SaveToDB = this.getCitizenDLInfoRepository.create(DBparams);
          const DBresponse = await SaveToDB.save();

          if (DBresponse?.id) {
            this.logger.log(
              `["getCitizenDLInfo"] -> Yakeen Response saved to DB`,
            );
          }
        } catch (err) {}
        // result = JSON.parse(result);
      }
      if (!result['soap:Envelope']) result = JSON.parse(result);

      console.log(result);
      result =
        result['soap:Envelope']['soap:Body']['ns1:getCitizenDLInfoResponse'][
          'CitizenDLInfoResult'
        ]; //.map( function(obj){ return obj?._text })
      console.log(result);
      let CitizenDLInfo: any = {
        firstName: result?.firstName?._text,
        secondName: result?.secondName?._text,
        thirdName: result?.thirdName?._text,
        lastName: result?.lastName?._text,
        englishFirstName: result?.englishFirstName?._text,
        englishSecondName: result?.englishSecondName?._text,
        englishThirdName: result?.englishThirdName?._text,
        englishLastName: result?.englishLastName?._text,
        fatherName: result?.fatherName?._text,
        grandFatherName: result?.grandFatherName?._text,
        familyName: result?.familyName?._text,
        dateOfBirthH: result?.dateOfBirthH?._text,
        dateOfBirthG: result?.dateOfBirthG?._text,
        idExpiryDate: result?.idExpiryDate?._text,
        iqamaExpiryDateH: result?.iqamaExpiryDateH?._text,
        gender: result?.gender?._text,
        occupationCode: result?.occupationCode?._text,

        completeInfo: result,
      };
      return ResponseHandler.success(CitizenDLInfo);
    } catch (err) {
      try {
        this.logger.error(
          `[getCitizenDLInfo] -> Error in catch: ${err.message}`,
        );
        // console.log(err)

        if (axios.isAxiosError(err)) {
          this.logger.error(
            `[getCitizenDLInfo] -> Error in catch | getCitizenDLInfo API message: ${JSON.stringify(
              err?.response?.data,
            )}`,
          );

          let result = this.xmlToJsonConverter.xml2json(
            err?.response?.data,
            this.xmlToJsonOptions,
          );
          result = JSON.parse(result)['soap:Envelope']['soap:Body'][
            'soap:Fault'
          ]['faultstring']?._text;
          return ResponseHandler.error(
            err.response?.status || HttpStatus.BAD_REQUEST,
            result ||
              err.response?.data?.message ||
              errorMessage.SOMETHING_WENT_WRONG,
          );
        } else
          return ResponseHandler.error(
            HttpStatus.BAD_REQUEST,
            err?.message || errorMessage.SOMETHING_WENT_WRONG,
          );
      } catch (err) {
        return ResponseHandler.error(
          HttpStatus.BAD_REQUEST,
          errorMessage.SOMETHING_WENT_WRONG,
        );
      }
    }
  }

  async getCitizenInfo2(params: getCitizenInfo2Dto) {
    try {
      this.logger.log(
        `["getCitizenInfo2"] -> params: ${JSON.stringify(params)}`,
      );
      this.logger.log(`["getCitizenInfo2"] -> LOCAL SEARCH START`);
      let result, YakeenDB, YakeenRow;
      if (appConfig().mode === 'dev') {
        YakeenDB = this.getCitizenInfo2Repository.createQueryBuilder(
          'getCitizenInfo2',
        );
        YakeenDB.where({ userid: parseInt(params.userid) });
        YakeenRow = await YakeenDB.getOne();
      }
      // let result;
      if (YakeenRow?.id) {
        this.logger.log(
          `["getCitizenInfo2"] -> LOCAL SEARCH Data found: ${YakeenRow.data}`,
        );

        if (YakeenRow?.dateOfBirth != params.dateOfBirth) {
          this.logger.error(
            `["getCitizenInfo2"] -> LOCAL SEARCH Data found but id not matched with sequence number`,
          );
          return ResponseHandler.error(
            HttpStatus.NOT_ACCEPTABLE,
            this.yakeenErrorCodetoHttpCode('9').message,
          );
        }
        result = YakeenRow.data;
      } else {
        const RequestXml = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:yak="http://yakeen4ride.yakeen.elm.com/">
                        <soapenv:Header/>
                        <soapenv:Body>
                            <yak:getCitizenInfo2>
                                <!--Optional:-->
                                <CitizenInfo2Request>
                                    <!--Optional:-->
                                    <chargeCode>${this.apiChargeCode}</chargeCode>
                                    <!--Optional:-->
                                    <dateOfBirth>${params.dateOfBirth}</dateOfBirth>
                                    <!--Optional:-->
                                    <nin>${params.userid}</nin>
                                    <!--Optional:-->
                                    <password>${this.apiPassword}</password>
                                    <!--Optional:-->
                                    <referenceNumber>?</referenceNumber>
                                    <!--Optional:-->
                                    <userName>${this.apiUsername}</userName>
                                </CitizenInfo2Request>
                            </yak:getCitizenInfo2>
                        </soapenv:Body>
                        </soapenv:Envelope>`;

        //this.logger.log(`["getCitizenInfo2"] -> params: ${RequestXml}`);

        const apiRes = await axios.post(
          this.apiUrl,
          RequestXml,
          this.axiosConfig,
        );

        this.logger.log(
          `["getCitizenInfo2"] -> Yakeen api response: ${apiRes.data}`,
        );

        result = this.xmlToJsonConverter.xml2json(
          apiRes.data,
          this.xmlToJsonOptions,
        );

        this.logger.log(`["getCitizenInfo2"] -> DB entry start`);
        const DBparams = {
          dateOfBirth: params?.dateOfBirth,
          data: result,
          userid: parseInt(params?.userid),
        };
        try {
          const SaveToDB = this.getCitizenInfo2Repository.create(DBparams);
          const DBresponse = await SaveToDB.save();

          if (DBresponse?.id) {
            this.logger.log(
              `["getCitizenInfo2"] -> Yakeen Response saved to DB`,
            );
          }
        } catch (err) {}
      }
      if (!result['soap:Envelope']) result = JSON.parse(result);
      result =
        result['soap:Envelope']['soap:Body']['ns1:getCitizenInfo2Response'][
          'CitizenInfo2Result'
        ];
      const AlienDLInfoByIqama = {
        firstName: result?.firstName?._text,
        fatherName: result?.fatherName?._text,
        grandFatherName: result?.grandFatherName?._text,
        familyName: result?.familyName?._text,
        englishFirstName: result?.englishFirstName?._text,
        englishSecondName: result?.englishSecondName?._text,
        englishThirdName: result?.englishThirdName?._text,
        englishLastName: result?.englishLastName?._text,
        dateOfBirthG: result?.dateOfBirthG?._text,
        dateOfBirthH: result?.dateOfBirthH?._text,
        gender: result?.gender?._text,
        logId: result?.logId?._text,
        completeInfo: result,
      };
      console.log(AlienDLInfoByIqama);
      return ResponseHandler.success(AlienDLInfoByIqama);
    } catch (err) {
      try {
        this.logger.error(
          `[getCitizenInfo2] -> Error in catch: ${err.message}`,
        );
        // console.log(err)

        if (axios.isAxiosError(err)) {
          this.logger.error(
            `[getCitizenInfo2] -> Error in catch | getCitizenInfo2 API message: ${JSON.stringify(
              err?.response?.data,
            )}`,
          );

          let result = this.xmlToJsonConverter.xml2json(
            err?.response?.data,
            this.xmlToJsonOptions,
          );
          result = JSON.parse(result)['soap:Envelope']['soap:Body'][
            'soap:Fault'
          ]['faultstring']?._text;
          return ResponseHandler.error(
            err.response?.status || HttpStatus.BAD_REQUEST,
            result ||
              err.response?.data?.message ||
              errorMessage.SOMETHING_WENT_WRONG,
          );
        } else
          return ResponseHandler.error(
            HttpStatus.BAD_REQUEST,
            err?.message || errorMessage.SOMETHING_WENT_WRONG,
          );
      } catch (err) {
        return ResponseHandler.error(
          HttpStatus.BAD_REQUEST,
          errorMessage.SOMETHING_WENT_WRONG,
        );
      }
    }
  }

  /////////////helpers!!!!!

  vehiclePlateLettersConvertArToAr(plateLetters: string) {
    try {
      // console.log(plateLetters);
      switch (plateLetters) {
        case 'أ':
          return (plateLetters = 'ا');
        case 'ي':
          return (plateLetters = 'ى');
        default:
          return plateLetters;
      }
    } catch (err) {
      return ResponseHandler.error(
        HttpStatus.BAD_REQUEST,
        err?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  vehiclePlateLettersConvertArToEn(plateLetters: string) {
    try {
      switch (plateLetters) {
        case 'أ':
          return (plateLetters = 'A');
        case 'ا':
          return (plateLetters = 'A');
        case 'ب':
          return (plateLetters = 'B');
        case 'ح':
          return (plateLetters = 'J');
        case 'د':
          return (plateLetters = 'D');
        case 'ر':
          return (plateLetters = 'R');
        case 'س':
          return (plateLetters = 'S');
        case 'ص':
          return (plateLetters = 'X');
        case 'ط':
          return (plateLetters = 'T');
        case 'ع':
          return (plateLetters = 'E');
        case 'ق':
          return (plateLetters = 'G');
        case 'ك':
          return (plateLetters = 'K');
        case 'ل':
          return (plateLetters = 'L');
        case 'م':
          return (plateLetters = 'Z');
        case 'ن':
          return (plateLetters = 'N');
        case 'ه':
          return (plateLetters = 'H');
        case 'و':
          return (plateLetters = 'U');
        case 'ى':
          return (plateLetters = 'V');
        case 'ي':
          return (plateLetters = 'V');
        default:
          return plateLetters;
      }
    } catch (err) {
      return ResponseHandler.error(
        HttpStatus.BAD_REQUEST,
        err?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }
  yakeenErrorCodetoHttpCode(code: string) {
    try {
      switch (code) {
        case '1':
          return {
            httpStatus: HttpStatus.NOT_FOUND,
            message: 'The ID no is not found at nic.',
            messageAr:
              'لم يتم العثور على رقم الهوية الوطنية في مركز أمن المعلومات',
          };
        case '2': {
          return {
            httpStatus: HttpStatus.UNPROCESSABLE_ENTITY,
            message: 'The nin format is not valid.',
            messageAr: 'صيغة ادخال الهوية الوطنية غير صحيحة',
          };
        }
        case '3': {
          return {
            httpStatus: HttpStatus.UNAUTHORIZED,
            message: 'Not authorized.',
            messageAr: 'غير مصرح',
          };
        }
        case '5': {
          return {
            httpStatus: HttpStatus.UNPROCESSABLE_ENTITY,
            message: 'The LicssExpiryDateH format is not valid.',
            messageAr: 'صيغة تاريخ انتهاء رخصة السياقة غير صحيح',
          };
        }
        case '6': {
          return {
            httpStatus: HttpStatus.NOT_FOUND,
            message: '(CitizenDLinfo) IdExpiryDate does not match NIC records.',
            messageAr: '(معلومات المواطن) معلومات انتهاء الهوية غير مطابقة',
          };
        }
        case '7': {
          return {
            httpStatus: HttpStatus.NOT_FOUND,
            message: 'Iqama number not found at NIC.',
            messageAr: 'لم يتم العثور على رقم الاقامة في مركز أمن المعلومات',
          };
        }
        case '8': {
          return {
            httpStatus: HttpStatus.UNPROCESSABLE_ENTITY,
            message: 'Iqama no format is invalid..',
            messageAr: 'الصيغة لرقم الاقامة غير صحيحة',
          };
        }
        case '9': {
          return {
            httpStatus: HttpStatus.UNPROCESSABLE_ENTITY,
            message: 'The LicssExpiryDateH format is not valid.',
            messageAr: 'صيغة تاريخ انتهاء رخصة السياقة غير صحيح',
          };
        }
        case '10': {
          return {
            httpStatus: HttpStatus.NOT_FOUND,
            message: '(AlienDLinfoByIqama) Licss does not match NIC records..',
            messageAr: '(معلومات المقيم) الرخصة غير مطابقة مع الهوية الوطنية',
          };
        }
        case '11': {
          return {
            httpStatus: HttpStatus.NOT_FOUND,
            message: 'Sequence number not found in NIC.',
            messageAr: 'لايوجد رقم تسلسلي مطابق مع الهوية الوطنية',
          };
        }
        case '12': {
          return {
            httpStatus: HttpStatus.NOT_FOUND,
            message: 'Cr Number not found at Saudi Post Record..',
            messageAr: 'السجل التجاري غير موجود في سجل البريد السعودي',
          };
        }
        case '13': {
          return {
            httpStatus: HttpStatus.UNPROCESSABLE_ENTITY,
            message: 'The sequenceNumber format is not valid..',
            messageAr: 'صيغة الرقم التسلسلي غير صحيحة',
          };
        }
        case '14': {
          return {
            httpStatus: HttpStatus.UNPROCESSABLE_ENTITY,
            message: 'The owner id fromat is not valid.',
            messageAr: 'الصيغة لصاحب الهوية غير صحيحة',
          };
        }
        case '15': {
          return {
            httpStatus: HttpStatus.NOT_FOUND,
            message: '(CarinfoBySequence) ownerId does not match NIC records..',
            messageAr:
              '(معلومات المركبة) معلومات صاحب الهوية غير مطابقة مع سجل بطاقة الهوية الوطنية',
          };
        }
        case '16': {
          return {
            httpStatus: HttpStatus.UNPROCESSABLE_ENTITY,
            message: 'The AddressLanguage format is not valid',
            messageAr: 'اللغة المدخلة في كتابة العنوان غير صحيحة',
          };
        }
        case '17': {
          return {
            httpStatus: HttpStatus.UNPROCESSABLE_ENTITY,
            message: 'The DateOfBirth format is not valid',
            messageAr: 'صيغة تاريخ الميلاد غير صحيحة',
          };
        }
        case '18': {
          return {
            httpStatus: HttpStatus.NOT_FOUND,
            message: '(CitizenInfo) DateOfBirth does not match NIC records.',
            messageAr:
              '(معلومات المواطن) تاريخ الميلاد غير مطابق مع رقم الهوية الوطنية',
          };
        }
        case '19': {
          return {
            httpStatus: HttpStatus.NOT_FOUND,
            message:
              '((AlienAddressInfoByIqama) DateOfBirth does not match NIC record..',
            messageAr:
              '(معلومات عنوان المقيم) لم يتم العثور على تاريخ الميلاد مطابق مع سجلات أمن المعلومات',
          };
        }
        case '20': {
          return {
            httpStatus: HttpStatus.UNPROCESSABLE_ENTITY,
            message: 'The CrNumber format is not valid',
            messageAr: 'رقم السجل التاجري غير صحيح',
          };
        }
        case '100': {
          return {
            httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
            message:
              'An error occurred while processing for request. Please try again .',
            messageAr: 'حدث خطأ أثناء معالجة الطلب. حاول مرة اخرى.',
          };
        }

        default:
          return {
            httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
            message:
              'An error occurred while processing for request. Please try again .',
            messageAr: 'حدث خطأ أثناء معالجة الطلب. حاول مرة اخرى..',
          };
      }
    } catch (err) {
      return ResponseHandler.error(
        HttpStatus.BAD_REQUEST,
        err?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }
}
