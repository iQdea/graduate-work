import { Injectable } from '@nestjs/common';
import { Upload } from './database/upload.entity';
import { EntityManager } from '@mikro-orm/postgresql';
import { ImageService } from './image.service';
import { Readable } from 'stream';
import { Error } from '../filters/http-exception.filter';
import { UploadGroup } from './database/upload-group';
import { DocService } from './doc.service';
import { VideoService } from './video.service';
import { Bucket } from './database/bucket';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../app.config';
import { splitStringAtIndex } from '../common/utils';

@Injectable()
export class ContentService {
  private readonly mimes: Record<string, string[]>;
  constructor(
    private readonly configService: ConfigService<AppConfig, true>,
    private readonly em: EntityManager,
    private readonly imageService: ImageService,
    private readonly docService: DocService,
    private readonly videoService: VideoService
  ) {
    this.mimes = this.configService.get('media.mimeTypes', { infer: true });
  }

  public async detectBucketAndGroup(mimeType: string): Promise<[Bucket, UploadGroup, boolean]> {
    if (this.mimes['image'].includes(mimeType)) {
      return [Bucket.images, UploadGroup.images, true];
    } else if (this.mimes['doc'].includes(mimeType)) {
      return [Bucket.docs, UploadGroup.docs, true];
    } else if (this.mimes['video'].includes(mimeType)) {
      return [Bucket.videos, UploadGroup.videos, true];
    } else {
      return [Bucket.tmp, UploadGroup.tmp, false];
    }
  }

  public allMimes(): string[] {
    return Object.values(this.mimes).flat();
  }

  public async getMedia(fileId: string, mode?: string): Promise<Readable | UploadGroup> {
    const [key] = splitStringAtIndex(fileId, fileId.lastIndexOf('.'));
    const upload = await this.em.findOne(Upload, key.split('.')[0]);
    if (!upload) {
      throw new Error(`File with id ${key} not found`);
    }
    if (mode == 'group') {
      return upload.group;
    }
    switch (upload.group) {
      case UploadGroup.images: {
        return await this.imageService.getImage(fileId);
      }
      case UploadGroup.docs: {
        return await this.docService.getDoc(fileId);
      }
      case UploadGroup.videos: {
        return await this.videoService.getVideo(fileId);
      }
      default: {
        throw new Error('Should never come here');
      }
    }
  }
}
