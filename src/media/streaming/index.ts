import * as AWS from 'aws-sdk';
import { StreamingService } from './streaming.service';
import appConfig from '../../app.config';
import { AwsCredentialIdentity } from '@aws-sdk/types';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AWSStreaming {
  public create(startPosition: number, bucket: string, key: string): Promise<StreamingService> {
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
          if (error) {
            throw error;
          }

          const options = {
            parameters: bucketParams,
            s3,
            maxLength: data.ContentLength ?? 1024 * 1024 * 10,
            byteRange: 1024 * 1024
          };

          const stream = new StreamingService(options);
          const byteRange = startPosition > 0 ? startPosition : options.byteRange;
          stream.adjustByteRange(byteRange);
          resolve(stream);
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}
