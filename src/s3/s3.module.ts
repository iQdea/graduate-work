import { DynamicModule, Inject, Module, Provider, Type } from '@nestjs/common';
import { S3ModuleAsyncOptions, S3ModuleOptions, S3ModuleOptionsFactory } from './s3.interfaces';
import { S3Client } from '@aws-sdk/client-s3';

export const S3_MODULE_CONNECTION = 'default';
export const S3_MODULE_CONNECTION_TOKEN = 'S3ModuleConnectionToken';
export const S3_MODULE_OPTIONS_TOKEN = 'S3ModuleOptionsToken';

const getS3OptionsToken = (connection?: string): string => {
  return `${connection || S3_MODULE_CONNECTION}_${S3_MODULE_OPTIONS_TOKEN}`;
};

export const getS3ConnectionToken = (connection?: string): string => {
  return `${connection || S3_MODULE_CONNECTION}_${S3_MODULE_CONNECTION_TOKEN}`;
};

const createS3Connection = (options: S3ModuleOptions): S3Client => {
  return new S3Client(options.config);
};

export const InjectS3 = (connection?: string) => {
  return Inject(getS3ConnectionToken(connection));
};

@Module({})
export class S3Module {
  public static forRootAsync(options: S3ModuleAsyncOptions, connection?: string): DynamicModule {
    const s3ConnectionProvider: Provider = {
      provide: getS3ConnectionToken(connection),
      useFactory(options: S3ModuleOptions) {
        return createS3Connection(options);
      },
      inject: [getS3OptionsToken(connection)]
    };

    return {
      module: S3Module,
      imports: options.imports,
      providers: [...this.createAsyncProviders(options, connection), s3ConnectionProvider],
      exports: [s3ConnectionProvider]
    };
  }

  public static createAsyncProviders(options: S3ModuleAsyncOptions, connection?: string): Provider[] {
    if (!(options.useExisting || options.useFactory || options.useClass)) {
      throw new Error('Invalid configuration. Must provide useFactory, useClass or useExisting');
    }

    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options, connection)];
    }

    return [
      this.createAsyncOptionsProvider(options, connection),
      {
        provide: <Type<S3ModuleOptionsFactory>>options.useClass,
        useClass: <Type<S3ModuleOptionsFactory>>options.useClass
      }
    ];
  }

  /* createAsyncOptionsProvider */
  public static createAsyncOptionsProvider(options: S3ModuleAsyncOptions, connection?: string): Provider {
    if (!(options.useExisting || options.useFactory || options.useClass)) {
      throw new Error('Invalid configuration. Must provide useFactory, useClass or useExisting');
    }

    if (options.useFactory) {
      return {
        provide: getS3OptionsToken(connection),
        useFactory: options.useFactory,
        inject: options.inject || []
      };
    }

    return {
      provide: getS3OptionsToken(connection),
      async useFactory(optionsFactory: S3ModuleOptionsFactory): Promise<S3ModuleOptions> {
        return optionsFactory.createS3ModuleOptions();
      },
      inject: [<Type<S3ModuleOptionsFactory>>(options.useClass || options.useExisting)]
    };
  }
}
