import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { AppConfig } from '../app.config';
import { S3MediaService } from './s3-media.service';
import { Bucket, Upload, UploadGroup } from './database/upload.entity';
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
export interface PocImage {
  bytes: Buffer;
  uuid: string;
  format: string;
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly conf: {
    maxFileSize: number;
    imageMimeTypes: string[];
  };
  private readonly isDev: boolean;
  private readonly axiosClient: AxiosInstance;

  constructor(
    private readonly configService: ConfigService<AppConfig, true>,
    private readonly s3Service: S3MediaService,
    private readonly em: EntityManager,
    private readonly eventEmitter: EventEmitter2,
    private readonly imageService: ImageService
  ) {
    this.conf = {
      maxFileSize: Math.floor(this.configService.get('media.maxFileSizeMegabytes', { infer: true }) * 1024 * 1024),
      imageMimeTypes: this.configService.get('media.mimeTypes.image', { infer: true })
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

  private onFileListener(payload: ListenFilesRequest) {
    return (name: string, file: Readable, info: FileInfo) => {
      const extension = info.mimeType.split('/')[1];
      const id = uuid();
      const fileInfo: File = {
        id,
        key: `${id}.${extension}`,
        extension,
        isSaved: false,
        size: 0,
        encoding: info.encoding,
        mimeType: info.mimeType,
        filename: info.filename,
        dimensions: {
          width: 0,
          height: 0
        }
      };

      const { writeableStream, upload } = this.s3Service.getWriteableStream(
        fileInfo.key,
        Bucket.images,
        fileInfo.mimeType
      );

      let stack;
      payload.data.upload.files.push(
        (async () => {
          try {
            await upload.done();
            fileInfo.size = await this.s3Service.sizeOf(fileInfo.key, Bucket.images);
            fileInfo.isSaved = true;

            if (!this.conf.imageMimeTypes.includes(fileInfo.mimeType)) {
              const error = new Error();
              if (this.isDev) {
                stack = error.stack;
              }
              fileInfo.error = {
                status: HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                title: 'Unsupported mime type',
                stack,
                detail: `supportedMimeTypes: ${this.conf.imageMimeTypes}, mimeType: ${fileInfo.mimeType}`
              };
            } else if (fileInfo.size > this.conf.maxFileSize) {
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
      this.onFileListener({
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
        if (this.conf.imageMimeTypes.includes(file.mimeType)) {
          resFile.group = UploadGroup.images;
        }
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
    const files = await this.getFiles(payload.data.upload.request);
    const allFiles = await Promise.all(files.map((file: File) => this.processFile(file)));
    const filesToRemove = allFiles.filter((file: File) => file.isSaved && file.error);
    if (filesToRemove.length > 0) {
      await this.s3Service.deleteMany(
        filesToRemove.map((file) => file.key),
        Bucket.images
      );
    }
    const uploadedFiles = allFiles.filter((file) => !filesToRemove.some((errorFile) => file.id === errorFile.id));
    const uploads = uploadedFiles.map((file) =>
      this.em.create(Upload, {
        id: file.id,
        userId,
        isReady: false,
        group: file.group || UploadGroup.any
      })
    );
    await this.em.persistAndFlush(uploads);
    return {
      data: {
        files: uploadedFiles.map((uploaded) => ({
          ...uploaded,
          fileName: uploaded.filename
        })),
        errors: filesToRemove.map((failed) => ({
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
    if (upload.group === UploadGroup.images) {
      const answer = await this.imageService.getImagesByUploadId(payload.data.upload.id);
      const fileIndex = answer.findIndex((x) => x.preview?.url?.includes('.s.'));
      file = fileIndex !== -1 ? answer[fileIndex] : file;
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
