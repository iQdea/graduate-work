import { PrometheusController } from '@willsoto/nestjs-prometheus';
import { Controller, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { Endpoint } from '../decorators';

@ApiTags('System')
@Controller()
export class MetricsController extends PrometheusController {
  @Endpoint('get', {
    summary: 'Метрики'
  })
  async index(@Res() response: Response) {
    await super.index(response);
  }
}
