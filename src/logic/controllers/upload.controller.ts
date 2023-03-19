import { Body, Controller, Param, Query, Req, Res, StreamableFile } from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Endpoint, EndpointResponse } from '../decorators';
import { UploadService } from '../../media/upload.service';
import { Request, Response } from 'express';
import { CreateUploadMediaResponse, DownloadMedias, ShowUploadMediaResponse } from '../dto/upload.dto';

@ApiTags('Media')
@Controller({
  path: 'media',
  version: '1'
})
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary'
          }
        }
      }
    }
  })
  @Endpoint('post', {
    path: 'upload',
    protected: true,
    response: CreateUploadMediaResponse,
    summary: 'Загрузить файл или несколько'
  })
  async createUploadMedia(@Req() request: Request): EndpointResponse<CreateUploadMediaResponse> {
    const userId = '3785dca6-2b1b-401e-b883-d760881bd527';
    const response = await this.uploadService.createUploadMedia(
      {
        data: {
          upload: {
            request
          }
        }
      },
      userId
    );

    return {
      dto: CreateUploadMediaResponse,
      data: { files: response.data.files },
      errors: response.data.errors,
      meta: {
        uploads: {
          total: response.data.files.length
        }
      }
    };
  }

  @Endpoint('get', {
    path: 'show/:id',
    protected: true,
    response: ShowUploadMediaResponse,
    summary: 'Получить информацию о загруженном файле'
  })
  async showUploadMedia(@Param('id') id: string): EndpointResponse<ShowUploadMediaResponse> {
    const media = await this.uploadService.showUploadMedia({
      data: {
        upload: {
          id
        }
      }
    });

    return {
      dto: ShowUploadMediaResponse,
      data: media ?? ({} as ShowUploadMediaResponse)
    };
  }

  @Endpoint('get', {
    path: 'download/:id',
    protected: true,
    response: StreamableFile,
    summary: 'Скачать файл из хранилища'
  })
  async downloadMedia(
    @Res({ passthrough: true }) res: Response,
    @Param('id') id: string,
    @Query('mimeType') mimeType: string,
    @Query('name') name: string
  ): Promise<StreamableFile> {
    const data = await this.uploadService.downloadMedia({
      data: {
        download: {
          id,
          mimeType
        }
      }
    });
    res.type(mimeType.split('/')[1]);
    res.set({
      'Content-Disposition': `attachment; filename="${name}.${mimeType.split('/')[1]}"`
    });
    return new StreamableFile(data);
  }

  @Endpoint('post', {
    path: 'download/files',
    protected: true,
    request: DownloadMedias,
    summary: 'Скачать файлы из хранилища (архивом)'
  })
  async downloadMedias(
    @Res({ passthrough: true }) res: Response,
    @Body('data') { downloads }: DownloadMedias,
    @Query('name') name: string
  ): Promise<StreamableFile> {
    const response = await this.uploadService.downloadMedias({
      downloads
    });
    await response.finalize();
    res.type('zip');
    res.set({
      'Content-Disposition': `attachment; filename="${name}.zip"`
    });
    return new StreamableFile(response);
  }
}
