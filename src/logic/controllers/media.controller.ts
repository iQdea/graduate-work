import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Param, Req, Res, StreamableFile } from '@nestjs/common';
import { Endpoint } from '../decorators';
import { ImageService } from '../../media/image.service';
import { Request, Response } from 'express';
import { DocService } from '../../media/doc.service';
import { VideoService } from '../../media/video.service';
import { AWSStreaming } from '../../media/streaming';
import { Bucket } from '../../media/database/bucket';

@ApiTags('Media')
@Controller({
  path: 'media',
  version: '1'
})
export class MediaController {
  constructor(
    private readonly imageService: ImageService,
    private readonly docService: DocService,
    private readonly videoService: VideoService,
    private readonly awsStreaming: AWSStreaming
  ) {}

  @Endpoint('get', {
    path: 'images/:id',
    protected: true,
    response: StreamableFile,
    summary: 'Посмотреть картинку из хранилища'
  })
  async getMediaImage(@Res({ passthrough: true }) res: Response, @Param('id') id: string): Promise<StreamableFile> {
    const data = await this.imageService.getImage(id);
    res.type(id.split('.').slice(-1)[0]);
    res.set({
      'Content-Disposition': `inline`
    });
    return new StreamableFile(data);
  }

  @Endpoint('get', {
    path: 'docs/:id',
    protected: true,
    response: StreamableFile,
    summary: 'Посмотреть документ из хранилища'
  })
  async getMediaDoc(@Res({ passthrough: true }) res: Response, @Param('id') id: string): Promise<StreamableFile> {
    const data = await this.docService.getDoc(id);
    res.type(id.split('.').slice(-1)[0]);
    res.set({
      'Content-Disposition': `inline`
    });
    return new StreamableFile(data);
  }

  @Endpoint('get', {
    path: 'videos/:id',
    protected: true,
    response: StreamableFile,
    summary: 'Посмотреть видео файл из хранилища'
  })
  async getMediaVideo(@Res({ passthrough: true }) res: Response, @Param('id') id: string): Promise<StreamableFile> {
    const data = await this.videoService.getVideo(id);
    res.type(id.split('.').slice(-1)[0]);
    res.set({
      'Content-Disposition': `inline`
    });
    return new StreamableFile(data);
  }

  @Get('/streaming/:id')
  async video(@Res() res: Response, @Req() req: Request, @Param('id') id: string) {
    const rangeHeader = req.headers.range;
    const startPosition = rangeHeader ? Number.parseInt(rangeHeader.split('=')[1]) : 0;

    const stream = await this.awsStreaming.create(startPosition, Bucket.videos, id);
    stream.pipe(res);
  }
}
