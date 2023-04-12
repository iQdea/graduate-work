import { ApiTags } from '@nestjs/swagger';
import { Controller, Param, Query, Res, StreamableFile } from '@nestjs/common';
import { Endpoint } from '../decorators';
import { ImageService } from '../../media/image.service';
import { Response } from 'express';
import { DocService } from '../../media/doc.service';

@ApiTags('Media')
@Controller({
  path: 'media',
  version: '1'
})
export class MediaController {
  constructor(private readonly imageService: ImageService, private readonly docService: DocService) {}
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
}
