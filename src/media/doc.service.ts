import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../app.config';
import { S3MediaService } from './s3-media.service';
import { EntityManager } from '@mikro-orm/postgresql';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { UploadGroup } from './database/upload-group';
import { File } from './interfaces';
import { Document } from './database/doc.entity';

@Injectable()
export class DocService {
  private readonly logger = new Logger(DocService.name);
  private readonly selCdnBase: string;
  private readonly docBucketName: string;
  constructor(
    private readonly configService: ConfigService<AppConfig, true>,
    private readonly s3Service: S3MediaService,
    private readonly em: EntityManager,
    private readonly eventEmitter: EventEmitter2
  ) {
    this.selCdnBase = this.configService.get('media.selectelCdnBase', { infer: true });
    this.docBucketName = this.configService.get('media.s3.buckets.docs', { infer: true });
  }

  @OnEvent('file.received', { promisify: true })
  async handleFileReceivedEvent(group: UploadGroup, file: File): Promise<File | null> {
    if (group !== UploadGroup.docs) {
      return null;
    }
    const { id: uploadId, mimeType, bucket, key } = file;

    const document = this.em.create(Document, {
      uploadId,
      mimeType
    });
    await this.em.persistAndFlush(document);

    this.eventEmitter.emit('upload.processed', uploadId);

    return {
      ...file,
      preview: {
        url: `${this.selCdnBase}/${bucket}/${key}`
      }
    };
  }
}
