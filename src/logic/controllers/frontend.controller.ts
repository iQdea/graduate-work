import { Controller, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { ApiExceptions, Endpoint } from '../decorators';

@ApiTags('Frontend')
@Controller({
  path: 'stream'
})
export class FrontendController {
  @Endpoint('get', {
    path: ':type',
    summary: 'Рендеринг шаблона в зависимости от типа контента'
  })
  @ApiExceptions({
    not_found: {
      status: 404,
      description: 'Page not found'
    }
  })
  @ApiParam({ name: 'type', required: true, description: 'type of page content', example: 'video' })
  getStream(@Param('type') type: string, @Res() res: Response) {
    res.render(type);
  }
}
