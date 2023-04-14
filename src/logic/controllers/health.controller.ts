import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, HttpHealthIndicator } from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../app.config';
import { Endpoint, EndpointResponse } from '../decorators';
import { HealthCheckResultDto } from '../dto/health.dto';

@ApiTags('System')
@Controller()
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private readonly configService: ConfigService<AppConfig, true>
  ) {}

  @Endpoint('get', {
    path: 'health',
    summary: 'Health check',
    response: HealthCheckResultDto
  })
  @HealthCheck()
  async check(): EndpointResponse<HealthCheckResultDto> {
    const res = await this.health.check([async () => this.http.pingCheck('default', this.configService.get('envUrl'))]);
    return {
      dto: HealthCheckResultDto,
      data: res
    };
  }

  @Get()
  default() {
    return {};
  }
}
