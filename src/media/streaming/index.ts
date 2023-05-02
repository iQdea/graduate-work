import * as AWS from 'aws-sdk';
import { StreamingOptions, StreamingService } from './streaming.service';
import appConfig from '../../app.config';
import { AwsCredentialIdentity } from '@aws-sdk/types';
import { Injectable } from '@nestjs/common';
import { isEmpty } from 'class-validator';

@Injectable()
export class AWSStreaming {
  public create(startPosition: number, bucket: string, key: string, range?: string): Promise<StreamingService> {
    return new Promise((resolve, reject) => {
      const bucketParams = {
        Bucket: bucket,
        Key: key
      };
      const config = appConfig().media.s3.config;
      const credentials = config.credentials as AwsCredentialIdentity;
      try {
        const s3 = new AWS.S3({
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          endpoint: config.endpoint as string,
          region: config.region as string,
          apiVersion: config.apiVersion,
          s3ForcePathStyle: config.forcePathStyle
        });
        s3.headObject(bucketParams, (error, data) => {
          if (error || !data.ContentLength) {
            throw error;
          }

          if (range && isEmpty(range?.split('=')[1].split('-')[1])) {
            range = range + data.ContentLength;
          }

          const options: StreamingOptions = {
            parameters: bucketParams,
            s3,
            maxLength: data.ContentLength,
            byteRange: appConfig().media.maxRangeSize,
            range
          };

          const stream = new StreamingService(options);
          if (range) {
            resolve(stream);
          } else {
            const byteRange = startPosition > 0 ? startPosition : options.byteRange ?? 0;
            stream.adjustByteRange(byteRange);
            resolve(stream);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}
