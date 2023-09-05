import { Injectable, Logger } from '@nestjs/common';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { createHash } from 'crypto';
import * as path from 'path';

import appConfig from "config/appConfig";
import { LoggerHandler } from './logger-handler';

interface getFileDto {
    name: string;
}

@Injectable()
export class AwsS3Service {
  region: string;
  provider: any;
  bucketName: string;
  chatBucketName: string;
  publicBucketName: string;
  chatMedia: string;
  chatGroup: string;
  constructor(){
    const awsRegion = appConfig().s3Region;
    this.region = (awsRegion) ? awsRegion.trim() : 'us-east-1';
    this.provider = new S3Client({
      credentials: {
        accessKeyId: appConfig().s3AccessKey,
        secretAccessKey: appConfig().s3SecretKey,
      },
      region: this.region,
    });
    this.bucketName = appConfig().s3Bucket;
    this.chatBucketName = appConfig().s3ChatBucket;
    this.publicBucketName = appConfig().s3PublicBucket;
    this.chatMedia = 'chat-media';
    this.chatGroup = 'chat-group';
  }

  private readonly logger = new LoggerHandler(AwsS3Service.name).getInstance();


  async getChatGroupImageUrl(params: getFileDto) {
    const accessUrl = appConfig().s3ChatAccessURL;
    return `${accessUrl}/${this.chatGroup}/${params.name}`;
  }
}