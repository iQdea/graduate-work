import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { Readable } from 'stream';
import { DownloadMediasRequest } from './interfaces';
import archiver, { Archiver } from 'archiver';
import { ContentService } from './content.service';
import { splitStringAtIndex } from '../common/utils';

@Injectable()
export class DownloadService {
  constructor(private readonly em: EntityManager, private readonly contentService: ContentService) {}

  public async downloadMedia(fileId: string, userId: string): Promise<Readable> {
    return (await this.contentService.getMedia({
      fileId,
      userId
    })) as Readable;
  }

  public async downloadZip(payload: DownloadMediasRequest): Promise<Archiver> {
    const zip = archiver('zip');
    for (const item of payload.downloads) {
      const [key, ext] = splitStringAtIndex(item.id, item.id.lastIndexOf('.'));
      zip.append(await this.downloadMedia(item.id, payload.userId), {
        name: (item.name ?? key) + '.' + ext
      });
    }
    return zip;
  }
}
