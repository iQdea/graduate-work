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
import { Video } from './database/video.entity';
import { VideoService } from './video.service';
import { AWSStreaming } from './streaming';

@Module({
  imports: [
    S3Module.forRootAsync({
      inject: [ConfigService],
      useFactory: (conf: ConfigService<AppConfig, true>) => conf.get<S3ModuleOptions>('media.s3', { infer: true })
    }),
    MikroOrmModule.forFeature({
      entities: [Upload, Image, Document, Video]
    })
  ],
  providers: [S3MediaService, UploadService, ImageService, DownloadService, DocService, VideoService, AWSStreaming],
  exports: [UploadService, ImageService, DocService, DownloadService, VideoService, AWSStreaming]
})
export class MediaModule {}
