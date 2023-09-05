import { Injectable, Logger } from '@nestjs/common';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { createHash } from 'crypto';
import * as path from 'path';
import * as common from 'oci-common';
import * as OciObjectStorage from 'oci-objectstorage';

import appConfig from 'config/appConfig';
import { LoggerHandler } from './logger-handler';

import { S3RequestPresigner } from '@aws-sdk/s3-request-presigner';
import { parseUrl } from '@aws-sdk/url-parser';
import { Sha256 } from '@aws-crypto/sha256-browser';
import { Hash } from '@aws-sdk/hash-node';
import { formatUrl } from '@aws-sdk/util-format-url';
import { HttpRequest } from '@aws-sdk/protocol-http';
import { json } from 'express';

var axios = require('axios');
interface uploadAdminImageDto {
  file: any;
}

interface uploadCabFileDto {
  name: string;
  file: any;
}

interface uploadCarFileDto {
  name: string;
  file: any;
}

interface uploadTripFileDto {
  id: string;
  type: string;
  file: any;
}

interface uploadChatFileDto {
  file: any;
}

interface uploadFileDto {
  acl: string;
  bucket: string;
  body: Buffer;
  path: string;
  mime?: string;
}

interface getFileDto {
  name: string;
}

interface presignedUrlDto {
  name: string;
  type: string;
}

interface uploadMakerIconDto {
  name: string;
  file: any;
}

interface uploadInventoryImageDto {
  name: string;
  file: any;
}

@Injectable()
export class AwsS3Service {
  region: string;
  provider: any;
  presigner: any;
  bucketName: string;
  chatBucketName: string;
  publicBucketName: string;
  tripsFolder: string;
  cabTypeFolder: string;
  carInfoFolder: string;
  adminProfile: string;
  customerProfile: string;
  chatMedia: string;
  chatGroup: string;
  chatThumb: string;
  makerIconFolder: string;
  inventoryIconFolder: string;

  constructor() {
    const awsRegion = appConfig().s3Region;
    this.region = awsRegion ? awsRegion.trim() : 'us-east-1';
    this.provider = new S3Client({
      credentials: {
        accessKeyId: appConfig().s3AccessKey,
        secretAccessKey: appConfig().s3SecretKey,
      },
      region: this.region,
    });

    this.presigner = new S3RequestPresigner({
      credentials: {
        accessKeyId: appConfig().s3AccessKey,
        secretAccessKey: appConfig().s3SecretKey,
      },
      region: this.region,
      sha256: Hash.bind(null, 'sha256'), // In Node.js
      //sha256: Sha256 // In browsers
    });
    this.bucketName = appConfig().ociBucket;
    this.chatBucketName = appConfig().ociBucket;
    this.publicBucketName = appConfig().ociBucket;
    this.tripsFolder = 'trips';
    this.cabTypeFolder = 'cab-type';
    this.carInfoFolder = 'car-info';
    this.adminProfile = 'admin';
    (this.customerProfile = 'customer'), (this.chatMedia = 'chat-media');
    this.chatGroup = 'chat-group';
    this.chatThumb = 'chat-thumb';
    this.makerIconFolder = 'maker-icons';
    this.inventoryIconFolder = 'vehicle-inventory';
  }

  private readonly logger = new LoggerHandler(AwsS3Service.name).getInstance();

  async getCabTypeFile(params: getFileDto) {
    // For Public URL
    const accessUrl = appConfig().ociAccessUrl;
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

  async getVehicleImage(params: getFileDto) {
    // For Public URL
    const accessUrl = appConfig().ociAccessUrl;
    return `${accessUrl}/${this.carInfoFolder}/${params.name}`;

    // // For Signed URL
    // const expires = 1 * 60 * 3600;
    // const keyPath = `${this.carInfoFolder}/${params.name}`;
    // const command = new GetObjectCommand({
    //   Bucket: this.bucketName,
    //   Key: keyPath,
    // });
    // const url = await getSignedUrl(this.provider, command, { expiresIn: expires });
    // return url;
  }

  async getChatMediaUrl(params: getFileDto) {
    const accessUrl = appConfig().ociAccessUrl;
    return `${accessUrl}/${this.chatMedia}/${params.name}`;
  }

  async getChatGroupImageUrl(params: getFileDto) {
    const accessUrl = appConfig().ociAccessUrl;
    return `${accessUrl}/${this.chatGroup}/${params.name}`;
  }

  uploadAdminImage(params: uploadAdminImageDto) {
    try {
      const imgObject = params.file;

      const extname = path.extname(imgObject.originalname).toLowerCase();
      const extstmp = Date.now();
      const imgname = imgObject.originalname
        .split('.')
        .slice(0, -1)
        .join('.')
        .replace(/ /g, '-')
        .replace(/[^A-Za-z0-9-_]/g, '')
        .toLowerCase();
      const filename: string = `${imgname}-${extstmp}${extname}`;
      const keyPath = `${this.adminProfile}/${filename}`;

      const options: uploadFileDto = {
        acl: 'public-read',
        bucket: this.bucketName,
        path: keyPath,
        body: imgObject.buffer,
        mime: imgObject?.mimetype,
      };
      this.uploadFile(options);

      return {
        profileImage: filename,
      };
    } catch (e) {
      this.logger.error('Profile picture upload initiate error', e.message);
      return {
        profileImage: '',
      };
    }
  }

  uploadCustomerImage(params: uploadAdminImageDto) {
    try {
      const imgObject = params.file;
      const accessUrl = appConfig().ociAccessUrl;
      const extname = path.extname(imgObject.originalname).toLowerCase();
      const extstmp = Date.now();
      const imgname = imgObject.originalname
        .split('.')
        .slice(0, -1)
        .join('.')
        .replace(/ /g, '-')
        .replace(/[^A-Za-z0-9-_]/g, '')
        .toLowerCase();
      const filename: string = `${imgname}-${extstmp}${extname}`;
      const keyPath = `${this.customerProfile}/${filename}`;

      const options: uploadFileDto = {
        acl: 'public-read',
        bucket: this.bucketName,
        path: keyPath,
        body: imgObject.buffer,
        mime: imgObject?.mimetype,
      };
      this.uploadFile(options);

      return {
        profileImage: `${accessUrl}/${this.customerProfile}/${filename}`,
      };
    } catch (e) {
      this.logger.error('Profile picture upload initiate error', e.message);
      return {
        profileImage: '',
      };
    }
  }

  uploadCabTypeFile(params: uploadCabFileDto) {
    try {
      const imgObject = params.file;

      const extname = path.extname(imgObject.originalname).toLowerCase();
      const extstmp = Date.now();
      const cabname = params.name
        .replace(/ /g, '-')
        .replace(/[^A-Za-z0-9-_]/g, '')
        .toLowerCase();
      const filename: string = `${cabname}-${extstmp}${extname}`;
      const keyPath = `${this.cabTypeFolder}/${filename}`;

      const options: uploadFileDto = {
        acl: 'public-read',
        bucket: this.bucketName,
        path: keyPath,
        body: imgObject.buffer,
        mime: imgObject?.mimetype,
      };
      this.uploadFile(options);

      return {
        categoryIcon: filename,
      };
    } catch (e) {
      this.logger.error('Cab type icon upload initiate error', e.message);
      return {
        categoryIcon: null,
      };
    }
  }

  uploadVehicleImage(params: uploadCarFileDto) {
    try {
      const imgObject = params.file;

      const extname = path.extname(imgObject.originalname).toLowerCase();
      const extstmp = Date.now();
      const cabname = params.name
        .replace(/ /g, '-')
        .replace(/[^A-Za-z0-9-_]/g, '')
        .toLowerCase();
      const filename: string = `${cabname}-${extstmp}${extname}`;
      const keyPath = `${this.carInfoFolder}/${filename}`;

      const options: uploadFileDto = {
        acl: 'public-read',
        bucket: this.bucketName,
        path: keyPath,
        body: imgObject.buffer,
        mime: imgObject?.mimetype,
      };
      this.uploadFile(options);

      return {
        vehicleImage: filename,
      };
    } catch (e) {
      this.logger.error('Vehicle image upload initiate error', e.message);
      return {
        vehicleImage: null,
      };
    }
  }

  uploadTripFile(params: uploadTripFileDto) {
    try {
      const type = params.type;
      const imgObject = params.file;

      const extname = path.extname(imgObject.originalname).toLowerCase();
      const extstmp = Date.now();
      const filename: string = `${type}-${extstmp}${extname}`;
      const keyPath = `${this.tripsFolder}/${params.id}/${filename}`;

      const options: uploadFileDto = {
        acl: 'public-read',
        bucket: this.bucketName,
        path: keyPath,
        body: imgObject.buffer,
        mime: imgObject?.mimetype,
      };
      this.uploadFile(options);

      return {
        image: filename,
      };
    } catch (e) {
      this.logger.error('Trip image upload initiate error', e.message);
      return {
        image: '',
      };
    }
  }

  uploadChatFile(params: uploadChatFileDto) {
    try {
      const mediaObject = params.file;

      const extname = path.extname(mediaObject.originalname).toLowerCase();
      const extstmp = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}`;
      const hashkey = createHash('md5').update(extstmp).digest('hex');
      const filename: string = `${hashkey}${extname}`;
      const keyPath = `${this.chatMedia}/${filename}`;

      const options: uploadFileDto = {
        acl: 'public-read',
        bucket: this.chatBucketName,
        path: keyPath,
        body: mediaObject.buffer,
        mime: mediaObject?.mimetype,
      };
      this.uploadFile(options);

      return filename;
    } catch (e) {
      this.logger.error('Chat media upload initiate error', e.message);
      return '';
    }
  }

  uploadChatGroupImage(params: uploadChatFileDto) {
    try {
      const mediaObject = params.file;

      const extname = path.extname(mediaObject.originalname).toLowerCase();
      const extstmp = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}`;
      const hashkey = createHash('md5').update(extstmp).digest('hex');
      const filename: string = `${hashkey}${extname}`;
      const keyPath = `${this.chatGroup}/${filename}`;
      const options: uploadFileDto = {
        acl: 'public-read',
        bucket: this.chatBucketName,
        path: keyPath,
        body: mediaObject.buffer,
        mime: mediaObject?.mimetype,
      };
      this.uploadFile(options);

      return filename;
    } catch (e) {
      this.logger.error('Chat media upload initiate error', e.message);
      return '';
    }
  }
  async uploadFile(options: uploadFileDto) {
    try {
      const configurationFilePath = appConfig().ociConfigFile;
      const provider = new common.ConfigFileAuthenticationDetailsProvider(
        configurationFilePath,
      );
      const objectStorageClient: OciObjectStorage.ObjectStorageClient = new OciObjectStorage.ObjectStorageClient(
        {
          authenticationDetailsProvider: provider,
        },
      );
      const uploadManager = new OciObjectStorage.UploadManager(
        objectStorageClient,
      );
      const imageUpload = await uploadManager.upload({
        content: {
          stream: options.body,
        },
        singleUpload: true,
        requestDetails: {
          namespaceName: appConfig().ociNameSpace,
          bucketName: options.bucket,
          objectName: options.path,
          contentType: options?.mime,
        },
      });
      if (imageUpload?.eTag) {
        this.logger.log('File upload success: ');
      } else {
        this.logger.error('File upload failed: ');
      }

      return {
        success: 1,
        message: 'Async upload',
      };
    } catch (e) {
      return {
        success: 0,
        message: e.message,
      };
    }
  }

  // async uploadFile(options: uploadFileDto) {
  //   try {
  //     const putObjectCommand = new PutObjectCommand({
  //       ACL: options.acl,
  //       Bucket: options.bucket,
  //       Key: options.path,
  //       Body: options.body,
  //       ContentType: options?.mime,
  //     });
  //     this.provider.send(putObjectCommand).catch((error) => {
  //       if (error) {
  //         this.logger.error('File upload failed: ', JSON.stringify(error));
  //       } else {
  //         this.logger.log('File upload success');
  //       }
  //     });
  //     return {
  //       success: 1,
  //       message: 'Async upload',
  //     };
  //   } catch (e) {
  //     return {
  //       success: 0,
  //       message: e.message,
  //     };
  //   }
  // }

  async getChatPresignedUrl(params: presignedUrlDto) {
    let key: string = this.chatMedia;
    if (params.type === this.chatGroup) {
      key = this.chatGroup;
    } else if (params.type === this.chatThumb) {
      key = this.chatThumb;
    }

    const extname = path.extname(params?.name).toLowerCase();
    const extstmp = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const hashkey = createHash('md5').update(extstmp).digest('hex');
    const filename: string = `${hashkey}${extname}`;

    var keyPath = `${key}/${filename}`;
    const s3ObjectUrl = parseUrl(
      `https://${this.chatBucketName}.s3.${this.region}.amazonaws.com/${keyPath}`,
    );
    const url = await this.presigner.presign(
      new HttpRequest({
        ...s3ObjectUrl,
        headers: { 'Content-Type': 'binary/octet-stream', acl: 'public-read' },
        method: 'PUT',
      }),
    );
    return { presignedUrl: formatUrl(url), accessUrl: formatUrl(s3ObjectUrl) };
  }

  async uploadSigned(params) {
    const axiosResponse = await axios.put(
      params?.presignedUrl,
      {
        data: params?.file,
      },
      {
        headers: {
          'Content-Type': 'application/octet-stream',
        },
      },
    );

    let key: string = this.chatMedia;
    var keyPath = `${key}-test/${params?.file?.originalname}`;
    const s3ObjectUrl = parseUrl(
      `https://${this.chatBucketName}.s3.${this.region}.amazonaws.com/${keyPath}`,
    );
    const url = await this.presigner.presign(new HttpRequest(s3ObjectUrl));
    return url;
  }

  uploadMakerIcon(params: uploadMakerIconDto) {
    try {
      const imgObject = params.file;

      const extname = path.extname(imgObject.originalname).toLowerCase();
      const extstmp = 'Ride'; //Date.now();
      const makername = params.name
        .replace(/ /g, '-')
        .replace(/[^A-Za-z0-9-_]/g, '')
        .toLowerCase();
      const filename: string = `${makername}-${extstmp}${extname}`;
      const keyPath = `${this.makerIconFolder}/${filename}`;

      const options: uploadFileDto = {
        acl: 'public-read',
        bucket: this.bucketName,
        path: keyPath,
        body: imgObject.buffer,
        mime: imgObject?.mimetype,
      };
      this.uploadFile(options);

      return {
        makerIcon: filename,
      };
    } catch (e) {
      this.logger.error('Cab type icon upload initiate error', e.message);
      return {
        makerIcon: null,
      };
    }
  }

  async getMakerIcon(params: getFileDto) {
    // For Public URL
    const accessUrl = appConfig().ociAccessUrl;
    return `${accessUrl}/${this.makerIconFolder}/${params.name}`;
  }

  uploadInventoryIcon(params: uploadInventoryImageDto) {
    try {
      const imgObject = params.file;

      const extname = path.extname(imgObject.originalname).toLowerCase();
      const extstmp = Date.now();
      const vehiclename = params.name
        .replace(/ /g, '-')
        .replace(/[^A-Za-z0-9-_]/g, '')
        .toLowerCase();
      const filename: string = `${vehiclename}-${extstmp}${extname}`;
      const keyPath = `${this.inventoryIconFolder}/${filename}`;

      const options: uploadFileDto = {
        acl: 'public-read',
        bucket: this.bucketName,
        path: keyPath,
        body: imgObject.buffer,
        mime: imgObject?.mimetype,
      };
      this.uploadFile(options);

      return {
        inventoryIcon: filename,
      };
    } catch (e) {
      this.logger.error('Cab type icon upload initiate error', e.message);
      return {
        inventoryIcon: null,
      };
    }
  }

  async getInventoryIcon(params: getFileDto) {
    // For Public URL
    const accessUrl = appConfig().s3AccessURL;
    return `${accessUrl}/${this.inventoryIconFolder}/${params.name}`;
  }
}
