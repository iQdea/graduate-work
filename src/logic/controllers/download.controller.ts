import { Body, Controller, HttpStatus, Param, Query, Res, StreamableFile } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiExceptions, Endpoint } from '../decorators';
import { Response } from 'express';
import { DownloadMedias } from '../dto/upload.dto';
import { DownloadService } from '../../media/download.service';
import { UserId } from '../decorators';

@ApiTags('Download')
@Controller({
  path: 'download',
  version: '1'
})
export class DownloadController {
  constructor(private readonly downloadService: DownloadService) {}

  @Endpoint('post', {
    path: '/files',
    protected: true,
    request: DownloadMedias,
    default_response: {
      status: HttpStatus.OK,
      schema: {
        type: 'string',
        format: 'binary'
      }
    },
    summary: 'Скачать файлы из хранилища (архивом)'
  })
  @ApiExceptions({
    forbidden: {
      status: 403,
      description: 'Access denied'
    },
    not_found: {
      status: 404,
      description: 'Content not found'
    },
    unauthorized: {
      status: 401,
      description: 'Unauthorized'
    }
  })
  async downloadZip(
    @Res({ passthrough: true }) res: Response,
    @Body('data') { downloads }: DownloadMedias,
    @Query('name') name: string,
    @UserId() userId: string
  ): Promise<StreamableFile> {
    const response = await this.downloadService.downloadZip({
      downloads,
      userId
    });
    await response.finalize();
    res.type('zip');
    res.set({
      'Content-Disposition': `attachment; filename="${name}.zip"`
    });
    return new StreamableFile(response);
  }
  @Endpoint('post', {
    path: '/:id',
    protected: true,
    default_response: {
      status: HttpStatus.OK,
      schema: {
        type: 'string',
        format: 'binary'
      }
    },
    summary: 'Скачать файл из хранилища'
  })
  @ApiExceptions({
    forbidden: {
      status: 403,
      description: 'Access denied'
    },
    not_found: {
      status: 404,
      description: 'Content not found'
    },
    unauthorized: {
      status: 401,
      description: 'Unauthorized'
    }
  })
  async downloadMedia(
    @Res({ passthrough: true }) res: Response,
    @Param('id') id: string,
    @Query('name') name: string,
    @UserId() userId: string
  ): Promise<StreamableFile> {
    const data = await this.downloadService.downloadMedia(id, userId);
    const mimeType = id.split('.').slice(-1)[0];
    res.type(mimeType);
    res.set({
      'Content-Disposition': `attachment; filename="${name}.${mimeType}"`
    });
    return new StreamableFile(data);
  }
}
