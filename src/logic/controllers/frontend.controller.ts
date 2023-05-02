import { Controller, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { Endpoint } from '../decorators';

@ApiTags('Frontend')
@Controller({
  path: 'stream'
})
export class FrontendController {
  @Endpoint('get', {
    path: ':type',
    summary: 'Рендеринг шаблона в зависимости от типа контента'
  })
  getStream(@Param('type') type: string, @Res() res: Response) {
    res.render(type);
  }
}
