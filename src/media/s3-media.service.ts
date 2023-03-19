import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../app.config';
import stream, { Readable } from 'stream';
import { InjectS3, S3 } from '../s3';
import {
  AbortMultipartUploadCommandOutput,
  CompleteMultipartUploadCommandOutput,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Bucket } from './database/upload.entity';

@Injectable()
export class S3MediaService {
  private readonly buckets: Record<string, string>;
  constructor(private readonly configService: ConfigService<AppConfig, true>, @InjectS3() private readonly s3: S3) {
    this.buckets = this.configService.get('media.s3.buckets', { infer: true });
  }

  public async getReadableStream(key: string, bucket: Bucket): Promise<Readable> {
    const { Body: body } = await this.s3.send(
      new GetObjectCommand({
        Bucket: this.getBucketName(bucket),
        Key: key
      })
    );
    if (!(body instanceof Readable)) {
      throw new TypeError('body is not instance of Readable');
    }
    return body;
  }

  public getWriteableStream(key: string, bucket: Bucket, mimeType: string) {
    const writeableStream = new stream.PassThrough();
    const upload = new Upload({
      client: this.s3,
      params: {
        Bucket: this.getBucketName(bucket),
        Key: key,
        ContentType: mimeType,
        Body: writeableStream
      }
    });

    return {
      writeableStream,
      upload
    };
  }

  public async sizeOf(key: string, bucket: Bucket) {
    const { ContentLength: size } = await this.s3.send(
      new HeadObjectCommand({
        Key: key,
        Bucket: this.getBucketName(bucket)
      })
    );

    return size || 0;
  }

  public async deleteMany(keys: string[], bucket: Bucket) {
    return this.s3.send(
      new DeleteObjectsCommand({
        Bucket: this.getBucketName(bucket),
        Delete: { Objects: keys.map((key) => ({ Key: key })) }
      })
    );
  }

  private getBucketName(bucket: Bucket) {
    if (!this.buckets[bucket]) {
      throw new Error('Unknown bucket');
    }

    return this.buckets[bucket];
  }

  public async upload(
    key: string,
    mimeType: string,
    buffer: Buffer,
    bucket: Bucket
  ): Promise<AbortMultipartUploadCommandOutput | CompleteMultipartUploadCommandOutput> {
    const upload = new Upload({
      client: this.s3,
      params: {
        Bucket: this.getBucketName(bucket),
        Key: key,
        ContentType: mimeType,
        Body: buffer
      }
    });
    return await upload.done();
  }
}
