import { Injectable, Logger } from "@nestjs/common";
import * as path from "path";

import appConfig from "config/appConfig";
import { LoggerHandler } from "./logger-handler";

interface getFileDto {
  name: string;
}

@Injectable()
export class AwsS3Service {
  cabTypeFolder: string;
  carInfoFolder: string;
  constructor() {
    this.cabTypeFolder = "cab-type";
    this.carInfoFolder = "car-info";
  }

  private readonly logger = new LoggerHandler(AwsS3Service.name).getInstance();

  getPublicCabTypeFile(params: getFileDto) {
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
}
