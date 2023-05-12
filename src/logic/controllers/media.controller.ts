import { ApiTags } from '@nestjs/swagger';
import { Controller, HttpStatus, NotFoundException, Param, Req, Res, StreamableFile } from '@nestjs/common';
import { ApiExceptions, Endpoint } from '../decorators';
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
    path: ':id',
    default_response: {
      status: HttpStatus.OK,
      schema: {
        type: 'string',
        format: 'binary'
      }
    },
    summary: 'Посмотреть полный файл из хранилища'
  })
  @ApiExceptions({
    not_found: {
      status: 404,
      description: 'Content not found'
    }
  })
  async getMediaFile(@Res({ passthrough: true }) res: Response, @Param('id') id: string): Promise<StreamableFile> {
    const data = await this.contentService.getMedia({
      fileId: id
    });
    res.type(id.split('.').slice(-1)[0]);
    res.set({
      'Content-Disposition': `inline`
    });
    return new StreamableFile(data as Readable);
  }

  @Endpoint('get', {
    path: '/streaming/:id',
    summary: 'Стриминг видеофайла',
    default_response: {
      status: HttpStatus.OK,
      schema: {
        type: 'string',
        format: 'binary'
      }
    }
  })
  @ApiExceptions({
    not_found: {
      status: 404,
      description: 'Content not found'
    }
  })
  async video(@Res() res: Response, @Req() req: Request, @Param('id') id: string) {
    const rangeHeader = req.headers.range;
    const startPosition = rangeHeader ? Number.parseInt(rangeHeader.split('=')[1]) : 0;
    const data = await this.contentService.getMedia({
      fileId: id,
      mode: 'group'
    });
    const group = data as UploadGroup;
    if (group == UploadGroup.videos) {
      const stream = await this.awsStreaming.create(startPosition, Bucket.videos, id, rangeHeader);
      stream.pipe(res);
    } else {
      throw new NotFoundException('Not a video file');
    }
  }
}
