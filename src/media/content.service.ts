import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
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
import { GetMediaRequest } from './interfaces';
import { Image } from './database/image.entity';
import { Document } from './database/doc.entity';
import { Video } from './database/video.entity';

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

  public async getMedia(info: GetMediaRequest): Promise<Readable | UploadGroup> {
    const [key, ext] = splitStringAtIndex(info.fileId, info.fileId.lastIndexOf('.'));
    const upload = await this.em.findOne(Upload, key.split('.')[0]);
    if (!upload) {
      throw new NotFoundException(`Upload with id ${key} not found`);
    }
    if (info.userId && info.userId !== upload.userId) {
      throw new ForbiddenException(`User ${info.userId} has no access to file ${info.fileId}`);
    }
    if (info.mode == 'group') {
      return upload.group;
    }
    switch (upload.group) {
      case UploadGroup.images: {
        const sizeType = splitStringAtIndex(key, key.lastIndexOf('.'))[1];
        const data = await this.em.findOne(Image, {
          uploadId: upload.id,
          sizeType,
          mimeType: {
            $like: '%' + ext
          }
        });
        if (!data) {
          throw new NotFoundException(
            `Image with id ${upload.id}, sizeType ${sizeType} and extension ${ext} not found`
          );
        }
        return await this.imageService.getImage(info.fileId);
      }
      case UploadGroup.docs: {
        const data = await this.em.findOne(Document, {
          uploadId: upload.id,
          mimeType: {
            $like: '%' + ext
          }
        });
        if (!data) {
          throw new NotFoundException(`Document with id ${key} and extension ${ext} not found`);
        }
        return await this.docService.getDoc(info.fileId);
      }
      case UploadGroup.videos: {
        const data = await this.em.findOne(Video, {
          uploadId: upload.id,
          mimeType: {
            $like: '%' + ext
          }
        });
        if (!data) {
          throw new NotFoundException(`Video with id ${key} and extension ${ext} not found`);
        }
        return await this.videoService.getVideo(info.fileId);
      }
      default: {
        throw new Error('Should never come here');
      }
    }
  }
}
