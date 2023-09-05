import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateAuditLogDto {

  @IsNotEmpty()
  @IsString()
  moduleName: string

  @IsNotEmpty()
  @IsString()
  entityName: string

  @IsNotEmpty()
  @IsOptional()
  entityId: string

  @IsNotEmpty()
  @IsOptional()
  actionType: string

  @IsOptional()
  oldValues: any

  @IsOptional()
  newValues: any

  @IsOptional()
  createdBy?: string

}
