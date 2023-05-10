import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../app.config';
import { S3MediaService } from './s3-media.service';
import { EntityManager } from '@mikro-orm/postgresql';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { UploadGroup } from './database/upload-group';
import { File, UploadMediaResponse } from './interfaces';
import { Bucket } from './database/bucket';
import { Video } from './database/video.entity';

@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name);
  private readonly selCdnBase: string;
  private readonly videoBucketName: string;

  constructor(
    private readonly configService: ConfigService<AppConfig, true>,
    private readonly s3Service: S3MediaService,
    private readonly em: EntityManager,
    private readonly eventEmitter: EventEmitter2
  ) {
    this.selCdnBase = this.configService.get('media.selectelCdnBase', { infer: true });
    this.videoBucketName = this.configService.get('media.s3.buckets.videos.value', { infer: true });
  }

  @OnEvent('file.received', { promisify: true })
  async handleFileReceivedEvent(group: UploadGroup, file: File): Promise<File | null> {
    if (group !== UploadGroup.videos) {
      return null;
    }
    const { id: uploadId, mimeType, key } = file;
    const video = this.em.create(Video, {
      uploadId,
      mimeType
    });
    await this.em.persistAndFlush(video);

    return {
      ...file,
      preview: {
        url: `${this.selCdnBase}/${key}`
      }
    };
  }

  public async getVideoByUploadId(uploadId: string): Promise<UploadMediaResponse> {
    const video = await this.em.findOneOrFail(Video, { uploadId });
    const extension = video.mimeType.split('/')[1];
    const key = `${uploadId}.${extension}`;
    return {
      id: video.uploadId,
      mimeType: video.mimeType,
      size: await this.s3Service.sizeOf(key, Bucket.videos),
      preview: {
        url: `${this.selCdnBase}/${key}`
      }
    };
  }

  public async getVideo(videoId: string) {
    return this.s3Service.getReadableStream(videoId, Bucket.videos);
  }
}
