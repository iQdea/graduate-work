import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { AppConfig } from '../app.config';
import { S3MediaService } from './s3-media.service';
import { Upload } from './database/upload.entity';
import { EntityManager } from '@mikro-orm/postgresql';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { ImageService } from './image.service';
import Busboy, { FileInfo } from 'busboy';
import { Request } from 'express';
import { v4 as uuid } from 'uuid';
import { Readable } from 'stream';
import { ConfigService } from '@nestjs/config';
import { Error } from '../filters/http-exception.filter';
import {
  CreateUploadMediaRequest,
  File,
  ListenFilesRequest,
  ShowUploadMediaRequest,
  UploadMediaErrorsResponse,
  UploadMediaResponse
} from './interfaces';
import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import { UploadGroup } from './database/upload-group';
import { Bucket } from './database/bucket';
import * as utf8 from 'utf8';
import { DocService } from './doc.service';
import { VideoService } from './video.service';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly conf: {
    maxFileSize: number;
    mime: {
      imageMimeTypes: string[];
      docMimeTypes: string[];
      videoMimeTypes: string[];
    };
  };
  private readonly isDev: boolean;
  private readonly axiosClient: AxiosInstance;

  constructor(
    private readonly configService: ConfigService<AppConfig, true>,
    private readonly s3Service: S3MediaService,
    private readonly em: EntityManager,
    private readonly eventEmitter: EventEmitter2,
    private readonly imageService: ImageService,
    private readonly docService: DocService,
    private readonly videoService: VideoService
  ) {
    this.conf = {
      maxFileSize: Math.floor(this.configService.get('media.maxFileSizeMegabytes', { infer: true }) * 1024 * 1024),
      mime: {
        imageMimeTypes: this.configService.get('media.mimeTypes.image', { infer: true }),
        docMimeTypes: this.configService.get('media.mimeTypes.doc', { infer: true }),
        videoMimeTypes: this.configService.get('media.mimeTypes.video', { infer: true })
      }
    };
    this.isDev = this.configService.get('env') === 'development';

    this.axiosClient = axios.create();
    axiosRetry(this.axiosClient, {
      retries: 3,
      shouldResetTimeout: true,
      retryDelay: () => 5000,
      retryCondition: ({ response }): boolean => {
        return !(response && [401, 403, 404].includes(response.status));
      }
    });
  }

  private static concatMimes(mime: any): string[] {
    let result: string[] = [];
    for (const key in mime) {
      if (Array.isArray(mime[key])) {
        result = [...result, ...mime[key]];
      } else if (typeof mime[key] === 'object') {
        result = [...result, ...this.concatMimes(mime[key])];
      }
    }
    return result;
  }

  private async detectBucketAndGroup(mimeType: string): Promise<[Bucket, UploadGroup, boolean]> {
    if (this.conf.mime.imageMimeTypes.includes(mimeType)) {
      return [Bucket.images, UploadGroup.images, true];
    } else if (this.conf.mime.docMimeTypes.includes(mimeType)) {
      return [Bucket.docs, UploadGroup.docs, true];
    } else if (this.conf.mime.videoMimeTypes.includes(mimeType)) {
      return [Bucket.videos, UploadGroup.videos, true];
    } else {
      return [Bucket.tmp, UploadGroup.tmp, false];
    }
  }

  private async onFileListener(payload: ListenFilesRequest) {
    return async (name: string, file: Readable, info: FileInfo) => {
      const extension = info.mimeType.split('/')[1];
      const id = uuid();
      const [fileBucket, fileGroup, isSupported] = await this.detectBucketAndGroup(info.mimeType);
      const fileInfo: File = {
        id,
        key: `${id}.${extension}`,
        extension,
        isSaved: false,
        size: 0,
        encoding: info.encoding,
        mimeType: info.mimeType,
        filename: utf8.decode(info.filename),
        group: fileGroup,
        dimensions:
          fileBucket == Bucket.images
            ? {
                width: 0,
                height: 0
              }
            : undefined,
        bucket: fileBucket
      };
      let isAllowed = true;
      file.on('limit', () => {
        isAllowed = false;
      });
      const { writeableStream, upload } = this.s3Service.getWriteableStream(
        fileInfo.key,
        fileBucket,
        fileInfo.mimeType
      );
      const allowedMimes = UploadService.concatMimes(this.conf.mime);
      let stack;
      payload.data.upload.files.push(
        (async () => {
          try {
            await upload.done();
            fileInfo.size = await this.s3Service.sizeOf(fileInfo.key, fileBucket);
            fileInfo.isSaved = true;

            if (!isSupported) {
              const error = new Error();
              if (this.isDev) {
                stack = error.stack;
              }
              fileInfo.error = {
                status: HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                title: 'Unsupported mime type',
                stack,
                detail: `supportedMimeTypes: ${allowedMimes}, mimeType: ${fileInfo.mimeType}`
              };
            } else if (!isAllowed) {
              const error = new Error();
              if (this.isDev) {
                stack = error.stack;
              }
              fileInfo.error = {
                status: HttpStatus.PAYLOAD_TOO_LARGE,
                title: 'Too big file',
                stack,
                detail: `maxFileSize: ${this.conf.maxFileSize} bytes`
              };
            }
          } catch (error) {
            if (error instanceof Error) {
              if (this.isDev) {
                stack = error.stack;
              }
              fileInfo.error = {
                status: Number(error.name) ?? HttpStatus.INTERNAL_SERVER_ERROR,
                title: 'Internal Server Error',
                stack,
                detail: error.message
              };
            }
          }

          return fileInfo;
        })()
      );

      file.pipe(writeableStream);
    };
  }

  private async getFiles(request: Request): Promise<File[]> {
    const busboy = Busboy({
      headers: request.headers,
      limits: {
        fileSize: this.conf.maxFileSize + 1
      }
    });

    const files: Promise<File>[] = [];

    const errorHandler = (error: Error) => {
      request.unpipe(busboy);
      this.logger.error(error);
    };

    busboy.on('error', errorHandler).on(
      'file',
      await this.onFileListener({
        data: {
          upload: {
            files
          }
        }
      })
    );
    request.on('aborted', errorHandler);
    request.pipe(busboy);

    await new Promise((resolve) => request.once('close', resolve));

    return Promise.all(files);
  }

  private async processFile(file: File): Promise<File> {
    let resFile = file;
    let stack;
    if (!file.error) {
      try {
        const files = await this.eventEmitter.emitAsync('file.received', resFile.group, file);
        resFile = files.find(Boolean) ?? file;
      } catch (error) {
        if (error instanceof Error) {
          if (this.isDev) {
            stack = error.stack;
          }
          resFile.error = {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            title: 'Internal Server Error',
            detail: error.message,
            stack
          };
        }
      }
    }

    return resFile;
  }

  public async createUploadMedia(
    payload: CreateUploadMediaRequest,
    userId: string
  ): Promise<UploadMediaErrorsResponse> {
    await this.s3Service.createTempBucket();
    const files = await this.getFiles(payload.data.upload.request);
    const allFiles = await Promise.all(files.map((file: File) => this.processFile(file)));
    const failedFiles = allFiles.filter((file: File) => file.isSaved && file.error);
    const uploadedFiles = allFiles.filter((file) => !failedFiles.some((errorFile) => file.id === errorFile.id));
    const uploads = uploadedFiles.map((file) =>
      this.em.create(Upload, {
        id: file.id,
        userId,
        isReady: false,
        group: file.group
      })
    );
    await this.em.persistAndFlush(uploads);
    uploads.map((x: Upload) => this.eventEmitter.emit('upload.processed', x.id));
    await this.s3Service.deleteMany(failedFiles.map((file) => ({ key: file.key, bucket: file.bucket })));
    await this.s3Service.deleteTempBucket();
    return {
      data: {
        files: uploadedFiles.map((uploaded) => ({
          ...uploaded,
          fileName: uploaded.filename
        })),
        errors: failedFiles.map((failed) => ({
          ...failed.error,
          detail: failed.error?.detail + `, filename: ${failed.filename}`
        }))
      }
    };
  }

  public async showUploadMedia(payload: ShowUploadMediaRequest): Promise<UploadMediaResponse | undefined> {
    const upload = await this.em.findOne(Upload, payload.data.upload.id);
    if (!upload) {
      return undefined;
    }
    let file = {} as UploadMediaResponse;
    switch (upload.group) {
      case UploadGroup.images: {
        const answer = await this.imageService.getImagesByUploadId(payload.data.upload.id);
        const fileIndex = answer.findIndex((x) => x.preview?.url?.includes('.s.'));
        file = fileIndex !== -1 ? answer[fileIndex] : file;
        break;
      }
      case UploadGroup.docs: {
        file = await this.docService.getDocByUploadId(payload.data.upload.id);
        break;
      }
      case UploadGroup.videos: {
        file = await this.videoService.getVideoByUploadId(payload.data.upload.id);
        break;
      }
    }
    return file;
  }

  @OnEvent('upload.processed', { async: true })
  async handleUploadProcessed(uploadId: string) {
    const upload = await this.em.findOneOrFail(Upload, uploadId);
    upload.isReady = true;
    await this.em.persistAndFlush(upload);
  }
}
