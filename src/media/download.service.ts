import { Injectable } from '@nestjs/common';
import { Upload } from './database/upload.entity';
import { EntityManager } from '@mikro-orm/postgresql';
import { ImageService } from './image.service';
import { Readable } from 'stream';
import { Error } from '../filters/http-exception.filter';
import { DownloadMediaRequest, DownloadMediasRequest } from './interfaces';
import archiver, { Archiver } from 'archiver';
import { UploadGroup } from './database/upload-group';
import { DocService } from './doc.service';
import { VideoService } from './video.service';

@Injectable()
export class DownloadService {
  constructor(
    private readonly em: EntityManager,
    private readonly imageService: ImageService,
    private readonly docService: DocService,
    private readonly videoService: VideoService
  ) {}

  public async downloadMedia(payload: DownloadMediaRequest): Promise<Readable> {
    const upload = await this.em.findOne(Upload, payload.data.download.id);
    if (!upload) {
      throw new Error(`File with id ${payload.data.download.id} not found`);
    }
    switch (upload.group) {
      case UploadGroup.images: {
        return await this.imageService.getImage(payload.data.download.id + '.' + payload.data.download.mimeType);
      }
      case UploadGroup.docs: {
        return await this.docService.getDoc(payload.data.download.id + '.' + payload.data.download.mimeType);
      }
      case UploadGroup.videos: {
        return await this.videoService.getVideo(payload.data.download.id + '.' + payload.data.download.mimeType);
      }
      default: {
        throw new Error('Should never come here');
      }
    }
  }

  public async downloadZip(payload: DownloadMediasRequest): Promise<Archiver> {
    const zip = archiver('zip');
    for (const item of payload.downloads) {
      zip.append(
        await this.downloadMedia({
          data: {
            download: {
              id: item.id,
              mimeType: item.mimeType
            }
          }
        }),
        {
          name: item.name + '.' + item.mimeType
        }
      );
    }
    return zip;
  }
}
