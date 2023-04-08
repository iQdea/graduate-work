import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../app.config';
import stream, { Readable } from 'stream';
import { InjectS3, S3 } from '../s3';
import {
  AbortMultipartUploadCommandOutput,
  CompleteMultipartUploadCommandOutput,
  DeleteObjectsCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListBucketsCommand,
  CreateBucketCommand,
  DeleteBucketCommand,
  ListMultipartUploadsCommand,
  AbortMultipartUploadCommand,
  ListObjectsCommand
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Bucket } from './database/bucket';

@Injectable()
export class S3MediaService implements OnApplicationBootstrap {
  private readonly logger = new Logger(S3MediaService.name);
  private readonly buckets: Record<string, { value: string; temporary: boolean }>;
  constructor(private readonly configService: ConfigService<AppConfig, true>, @InjectS3() private readonly s3: S3) {
    this.buckets = this.configService.get('media.s3.buckets', { infer: true });
  }

  async onApplicationBootstrap() {
    await this.manageS3Buckets(
      Object.values(this.buckets)
        .filter((item) => !item.temporary)
        .map((x) => x.value)
    );
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
  public async deleteOne(key: string, bucket: Bucket) {
    return this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.getBucketName(bucket),
        Key: key
      })
    );
  }

  private getBucketName(bucket: Bucket) {
    if (!this.buckets[bucket]) {
      throw new Error('Unknown bucket');
    }

    return this.buckets[bucket].value;
  }

  public async createTempBucket() {
    try {
      await this.s3.send(new CreateBucketCommand({ Bucket: 'tmp' }));
      this.logger.warn(`Bucket tmp created`);
    } catch (error: any) {
      this.logger.error(`Error creating temp bucket: ${error.message}`);
    }
  }

  public async deleteTempBucket() {
    const { Uploads } = await this.s3.send(
      new ListMultipartUploadsCommand({
        Bucket: 'tmp'
      })
    );
    if (Uploads) {
      await Promise.all(
        Uploads.map(({ Key, UploadId }) =>
          this.s3.send(
            new AbortMultipartUploadCommand({
              Bucket: 'tmp',
              Key,
              UploadId
            })
          )
        )
      );
    }
    const { Contents } = await this.s3.send(
      new ListObjectsCommand({
        Bucket: 'tmp'
      })
    );
    if (Contents) {
      await this.s3.send(
        new DeleteObjectsCommand({
          Bucket: 'tmp',
          Delete: { Objects: Contents.map((x) => ({ Key: x.Key })) }
        })
      );
    }
    await this.deleteBucket('tmp');
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

  public async manageS3Buckets(bucketNames: string[]): Promise<void> {
    try {
      const { Buckets } = await this.s3.send(new ListBucketsCommand({}));
      const existingBucketNames = Buckets ? Buckets.map((bucket) => bucket.Name ?? '') : [];
      const filteredBucketNames = existingBucketNames.filter((name) => name !== '');
      const deniedBuckets = filteredBucketNames.filter((bucket) => !bucketNames.includes(bucket));
      if (deniedBuckets.length > 0) {
        await Promise.all(deniedBuckets.map((bucketName) => this.deleteBucket(bucketName)));
      } else {
        this.logger.warn(`No denied Buckets`);
      }
      const newBuckets = bucketNames.filter((name) => !filteredBucketNames.includes(name));
      if (newBuckets.length > 0) {
        const createBucketPromises = newBuckets.map((name) => this.s3.send(new CreateBucketCommand({ Bucket: name })));
        await Promise.all(createBucketPromises);
        this.logger.warn(`New Buckets: ${newBuckets}`);
      } else {
        this.logger.warn(`No new Buckets`);
      }
    } catch (error: any) {
      this.logger.error(`An error occurred while creating S3 buckets: ${error.message}`);
    }
  }

  public async deleteBucket(bucketName: string): Promise<void> {
    try {
      await this.s3.send(new DeleteBucketCommand({ Bucket: bucketName }));
      this.logger.warn(`Bucket ${bucketName} deleted.`);
    } catch (error: any) {
      this.logger.error(`Error deleting bucket ${bucketName}: ${error.message}`);
    }
  }
}
