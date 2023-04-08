import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { Upload } from './database/upload.entity';
import { Document } from './database/doc.entity';
import { UploadService } from './upload.service';
import { S3MediaService } from './s3-media.service';
import { ImageService } from './image.service';
import { DocService } from './doc.service';
import { Image } from './database/image.entity';
import { S3Module, S3ModuleOptions } from '../s3';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../app.config';
import { DownloadService } from './download.service';

@Module({
  imports: [
    S3Module.forRootAsync({
      inject: [ConfigService],
      useFactory: (conf: ConfigService<AppConfig, true>) => conf.get<S3ModuleOptions>('media.s3', { infer: true })
    }),
    MikroOrmModule.forFeature({
      entities: [Upload, Image, Document]
    })
  ],
  providers: [S3MediaService, UploadService, ImageService, DownloadService, DocService],
  exports: [UploadService, ImageService, DocService, DownloadService]
})
export class MediaModule {}
