import { ApiTags } from '@nestjs/swagger';
import { Controller, Param, Req, Res, StreamableFile } from '@nestjs/common';
import { Endpoint } from '../decorators';
import { Request, Response } from 'express';
import { AWSStreaming } from '../../media/streaming';
import { Bucket } from '../../media/database/bucket';
import { Readable } from 'stream';
import { ContentService } from '../../media/content.service';
import { UploadGroup } from '../../media/database/upload-group';

@ApiTags('Media')
@Controller({
  path: 'media',
  version: '1'
})
export class MediaController {
  constructor(private readonly contentService: ContentService, private readonly awsStreaming: AWSStreaming) {}

  @Endpoint('get', {
    path: '/streaming/:id',
    summary: 'Получить контент как stream'
  })
  async streaming(@Res({ passthrough: true }) res: Response, @Req() req: Request, @Param('id') id: string) {
    const rangeHeader = req.headers.range;
    const startPosition = rangeHeader ? Number.parseInt(rangeHeader.split('=')[1]) : 0;
    const data = await this.contentService.getMedia(id, 'group');
    const group = data as UploadGroup;
    if (group == UploadGroup.videos) {
      const stream = await this.awsStreaming.create(startPosition, Bucket.videos, id, rangeHeader);
      return stream.pipe(res);
    } else {
      const data = await this.contentService.getMedia(id);
      res.type(id.split('.').slice(-1)[0]);
      res.set({
        'Content-Disposition': `inline`
      });
      return new StreamableFile(data as Readable);
    }
  }
}
