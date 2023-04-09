import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../app.config';
import { S3MediaService } from './s3-media.service';
import { EntityManager } from '@mikro-orm/postgresql';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Injectable, Logger } from '@nestjs/common';
import sharp, { ResizeOptions } from 'sharp';
import { Image } from './database/image.entity';
import { File, UploadMediaResponse } from './interfaces';
import { CompleteMultipartUploadOutput } from '@aws-sdk/client-s3';
import { UploadGroup } from './database/upload-group';
import { Bucket } from './database/bucket';

@Injectable()
export class ImageService {
  private readonly logger = new Logger(ImageService.name);
  private readonly imageSizesConfig: Record<string, ResizeOptions & { coefficient: number }>;
  private readonly previewOptions: ResizeOptions;
  private readonly selCdnBase: string;
  private readonly imageBucketName: string;
  constructor(
    private readonly configService: ConfigService<AppConfig, true>,
    private readonly s3Service: S3MediaService,
    private readonly em: EntityManager,
    private readonly eventEmitter: EventEmitter2
  ) {
    this.previewOptions = this.configService.get('media.resizeImageBySharp.previewSize', { infer: true });
    this.imageSizesConfig = this.configService.get('media.resizeImageBySharp.sizes', { infer: true });
    this.selCdnBase = this.configService.get('media.selectelCdnBase', { infer: true });
    this.imageBucketName = this.configService.get('media.s3.buckets.images.value', { infer: true });
  }

  @OnEvent('file.received', { promisify: true })
  async handleFileReceivedEvent(group: UploadGroup, file: File): Promise<File | null> {
    if (group !== UploadGroup.images) {
      return null;
    }

    const { key, extension } = file;

    const sourceStream = await this.s3Service.getReadableStream(key, Bucket.images);

    const previewKey = key.replace(new RegExp('\\.' + extension + '$'), '.thumb.png');
    const { writeableStream, upload } = this.s3Service.getWriteableStream(previewKey, Bucket.images, 'image/png');
    let transformerError = null;
    const errorHandle = (error: Error) => {
      transformerError = error;
    };

    const transformer = sharp().on('error', errorHandle).resize(this.previewOptions).png();
    const metaReader = sharp().metadata((err: Error) => {
      if (err) {
        this.logger.error(err);
      }
    });

    sourceStream.pipe(transformer).pipe(writeableStream);

    const dimensions = await sourceStream.pipe(metaReader).metadata();
    if (!dimensions.width || !dimensions.height) {
      throw new Error('Should never come here');
    }
    file.dimensions = {
      width: dimensions.width,
      height: dimensions.height
    };
    const data = <CompleteMultipartUploadOutput>await upload.done();
    if (transformerError === null) {
      this.eventEmitter.emit('preview.created', file);
    } else {
      throw transformerError;
    }

    return {
      ...file,
      preview: {
        url: `${this.selCdnBase}/${data.Bucket}/${previewKey}`
      }
    };
  }

  @OnEvent('preview.created', { async: true })
  async handlePreviewCreatedEvent(file: File) {
    const { id: uploadId, key, extension, mimeType, dimensions } = file;
    if (!dimensions) {
      throw new Error('Not an image');
    }
    const sizes: Record<string, ResizeOptions> = {};
    for (const i of Object.keys(this.imageSizesConfig)) {
      sizes[i] = {
        width: Math.round(dimensions.width * this.imageSizesConfig[i].coefficient),
        height: Math.round(dimensions.height * this.imageSizesConfig[i].coefficient),
        fit: this.imageSizesConfig[i].fit
      };
    }
    await Promise.all(
      Object.entries(sizes).map(async ([sizeType, resizeOptions]) => {
        const imageKey = `${uploadId}.${sizeType}.${extension}`;
        const sourceStream = await this.s3Service.getReadableStream(key, Bucket.images);
        const { writeableStream, upload } = this.s3Service.getWriteableStream(imageKey, Bucket.images, mimeType);
        const transformer = sharp().resize(resizeOptions);
        sourceStream
          .on('error', (error) => this.logger.error(error))
          .pipe(transformer)
          .pipe(writeableStream);

        await upload.done();
        const image = this.em.create(Image, {
          uploadId,
          sizeType,
          mimeType,
          width: resizeOptions.width!,
          heigth: resizeOptions.height!
        });
        await this.em.persist(image);
      })
    );

    await this.em.flush();
  }

  public async getImagesByUploadId(uploadId: string): Promise<UploadMediaResponse[]> {
    const images = await this.em.find(Image, { uploadId });
    const files = [] as UploadMediaResponse[];
    for (const image of images) {
      const extension = image.mimeType.split('/')[1];
      const key = `${uploadId}.${image.sizeType}.${extension}`;
      files.push({
        id: image.uploadId,
        mimeType: image.mimeType,
        size: await this.s3Service.sizeOf(key, Bucket.images),
        preview: {
          url: `${this.selCdnBase}/${this.imageBucketName}/${key}`
        },
        dimensions: {
          width: image.width,
          height: image.heigth
        }
      });
    }
    return files;
  }

  public async getImage(imageId: string) {
    return this.s3Service.getReadableStream(imageId, Bucket.images);
  }
}
