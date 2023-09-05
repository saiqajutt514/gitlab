import { Injectable } from '@nestjs/common';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

import appConfig from "config/appConfig";


interface getImageDto {
  name: string;
}

@Injectable()
export class AwsS3Service {
  region: string;
  provider: any;
  bucketName: string;
  adminProfile: string;
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
    this.adminProfile = 'admin';
  }

  async getAdminImage(params: getImageDto) {
    // For Public URL
    const accessUrl = appConfig().s3AccessURL;
    return `${accessUrl}/${this.adminProfile}/${params.name}`;

    // // For Signed URL
    // const expires = 1 * 60 * 3600;
    // const keyPath = `${this.adminProfile}/${params.name}`;
    // const command = new GetObjectCommand({
    //   Bucket: this.bucketName,
    //   Key: keyPath,
    // });
    // const url = await getSignedUrl(this.provider, command, { expiresIn: expires });
    // return url;
  }

}