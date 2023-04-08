import { Injectable } from '@nestjs/common';
import { Upload } from './database/upload.entity';
import { EntityManager } from '@mikro-orm/postgresql';
import { ImageService } from './image.service';
import { Readable } from 'stream';
import { Error } from '../filters/http-exception.filter';
import { DownloadMediaRequest, DownloadMediasRequest } from './interfaces';
import archiver, { Archiver } from 'archiver';
import { UploadGroup } from './database/upload-group';

@Injectable()
export class DownloadService {
  constructor(private readonly em: EntityManager, private readonly imageService: ImageService) {}

  public async downloadMedia(payload: DownloadMediaRequest): Promise<Readable> {
    const upload = await this.em.findOne(Upload, payload.data.download.id.split('.')[0]);
    if (!upload) {
      throw new Error(`File with id ${payload.data.download.id} not found`);
    }
    if (upload.group === UploadGroup.images) {
      return await this.imageService.getImage(payload.data.download.id + '.' + payload.data.download.mimeType);
    } else {
      throw new Error('Should never come here');
    }
  }

  public async downloadMedias(payload: DownloadMediasRequest): Promise<Archiver> {
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
          name: item.name + '.' + item.mimeType.split('/')[1]
        }
      );
    }
    return zip;
  }
}
