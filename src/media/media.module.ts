import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { Upload } from './database/upload.entity';
import { UploadService } from './upload.service';
import { S3MediaService } from './s3-media.service';
import { ImageService } from './image.service';
import { Image } from './database/image.entity';
import { S3Module, S3ModuleOptions } from '../s3';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../app.config';

@Module({
  imports: [
    S3Module.forRootAsync({
      inject: [ConfigService],
      useFactory: (conf: ConfigService<AppConfig, true>) => conf.get<S3ModuleOptions>('media.s3', { infer: true })
    }),
    MikroOrmModule.forFeature({
      entities: [Upload, Image]
    })
  ],
  providers: [S3MediaService, UploadService, ImageService],
  exports: [UploadService, ImageService]
})
export class MediaModule {}
