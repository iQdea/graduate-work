import { ApiTags } from '@nestjs/swagger';
import { Controller, Param, Query, Res, StreamableFile } from '@nestjs/common';
import { Endpoint } from '../decorators';
import { ImageService } from '../../media/image.service';
import { Response } from 'express';

@ApiTags('Media')
@Controller({
  path: 'media',
  version: '1'
})
export class ImagesController {
  constructor(private readonly imageService: ImageService) {}
  @Endpoint('get', {
    path: 'images/:id',
    protected: true,
    response: StreamableFile,
    summary: 'Посмотреть файл из хранилища'
  })
  async getMedia(@Res({ passthrough: true }) res: Response, @Param('id') id: string): Promise<StreamableFile> {
    const data = await this.imageService.getImage(id);
    res.type(id.split('.').slice(-1)[0]);
    res.set({
      'Content-Disposition': `inline`
    });
    return new StreamableFile(data);
  }
}
