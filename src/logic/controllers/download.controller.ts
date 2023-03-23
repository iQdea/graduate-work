import { Body, Controller, Param, Query, Res, StreamableFile } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Endpoint } from '../decorators';
import { Response } from 'express';
import { DownloadMedias } from '../dto/upload.dto';
import { DownloadService } from '../../media/download.service';

@ApiTags('Download')
@Controller({
  path: 'download',
  version: '1'
})
export class DownloadController {
  constructor(private readonly downloadService: DownloadService) {}

  @Endpoint('get', {
    path: '/:id',
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
    const data = await this.downloadService.downloadMedia({
      data: {
        download: {
          id,
          mimeType
        }
      }
    });
    res.type(mimeType);
    res.set({
      'Content-Disposition': `attachment; filename="${name}.${mimeType}"`
    });
    return new StreamableFile(data);
  }

  @Endpoint('post', {
    path: '/files',
    protected: true,
    request: DownloadMedias,
    summary: 'Скачать файлы из хранилища (архивом)'
  })
  async downloadMedias(
    @Res({ passthrough: true }) res: Response,
    @Body('data') { downloads }: DownloadMedias,
    @Query('name') name: string
  ): Promise<StreamableFile> {
    const response = await this.downloadService.downloadMedias({
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
