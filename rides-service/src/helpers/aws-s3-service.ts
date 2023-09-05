import { Injectable } from '@nestjs/common';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

import appConfig from "config/appConfig";

interface getFileDto {
  name: string;
}

interface getTripFileDto{
  name: string;
  id: string
}

@Injectable()
export class AwsS3Service {
  region: string;
  provider: any;
  bucketName: string;
  tripsFolder: string;
  cabTypeFolder: string;
  constructor() {
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
    this.tripsFolder = 'trips';
    this.cabTypeFolder = 'cab-type';
  }

  async getCabTypeFile(params: getFileDto) {
    // For Public URL
    const accessUrl = appConfig().s3AccessURL;
    return `${accessUrl}/${this.cabTypeFolder}/${params.name}`;

    // // For Signed URL
    // const expires = 1 * 60 * 3600;
    // const keyPath = `${this.cabTypeFolder}/${params.name}`;
    // const command = new GetObjectCommand({
    //   Bucket: this.bucketName,
    //   Key: keyPath,
    // });
    // const url = await getSignedUrl(this.provider, command, { expiresIn: expires });
    // return url;
  }

  async getTripFiles(params: getTripFileDto) {
    // For Public URL
    const accessUrl = appConfig().s3AccessURL;
    return `${accessUrl}/${this.tripsFolder}/${params.id}/${params.name}`;

    // // For Signed URL
    // const expires = 1 * 60 * 3600;
    // const keyPath = `${this.tripsFolder}/${params.id}/${params.name}`;
    // const command = new GetObjectCommand({
    //   Bucket: this.bucketName,
    //   Key: keyPath,
    // });
    // const url = await getSignedUrl(this.provider, command, { expiresIn: expires });
    // return url;
  }

}
