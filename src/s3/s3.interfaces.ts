import { ModuleMetadata, Type } from '@nestjs/common/interfaces';
import * as AWS from '@aws-sdk/client-s3';

export type S3ClientConfig = AWS.S3ClientConfig;
export type S3 = AWS.S3Client;

export interface S3ModuleOptions {
  config: S3ClientConfig;
  buckets: Record<string, { value: string; temporary: boolean }>;
}

export interface S3ModuleOptionsFactory {
  createS3ModuleOptions(): Promise<S3ModuleOptions> | S3ModuleOptions;
}

export interface S3ModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  inject?: any[];
  useClass?: Type<S3ModuleOptionsFactory>;
  useExisting?: Type<S3ModuleOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<S3ModuleOptions> | S3ModuleOptions;
}
