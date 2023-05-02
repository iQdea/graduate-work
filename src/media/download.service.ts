import { Injectable } from '@nestjs/common';
import { Upload } from './database/upload.entity';
import { EntityManager } from '@mikro-orm/postgresql';
import { Readable } from 'stream';
import { Error } from '../filters/http-exception.filter';
import { DownloadMediasRequest } from './interfaces';
import archiver, { Archiver } from 'archiver';
import { ContentService } from './content.service';
import { splitStringAtIndex } from '../common/utils';

@Injectable()
export class DownloadService {
  constructor(private readonly em: EntityManager, private readonly contentService: ContentService) {}

  public async downloadMedia(fileId: string): Promise<Readable> {
    const [key] = splitStringAtIndex(fileId, fileId.lastIndexOf('.'));
    const upload = await this.em.findOne(Upload, key.split('.')[0]);
    if (!upload) {
      throw new Error(`File with id ${key} not found`);
    }
    return (await this.contentService.getMedia(fileId)) as Readable;
  }

  public async downloadZip(payload: DownloadMediasRequest): Promise<Archiver> {
    const zip = archiver('zip');
    for (const item of payload.downloads) {
      const [key, ext] = splitStringAtIndex(item.id, item.id.lastIndexOf('.'));
      zip.append(await this.downloadMedia(item.id), {
        name: (item.name ?? key) + '.' + ext
      });
    }
    return zip;
  }
}
