import { EntityRepository } from 'typeorm';
import { BaseAbstractRepository } from 'transportation-common';
import { OtpFailedLogsEntity } from '../entities/otpFailedLogs.entity';

@EntityRepository(OtpFailedLogsEntity)
export class OtpFailedLogsRepo extends BaseAbstractRepository<OtpFailedLogsEntity> {}
