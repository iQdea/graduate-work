import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, HttpHealthIndicator, MikroOrmHealthIndicator } from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../app.config';
import { EmptyEndpointResponse, Endpoint, EndpointResponse } from '../decorators';
import { HealthCheckResultDto } from '../dto/health.dto';
import { HealthIndicatorStatus } from '@nestjs/terminus/dist/health-indicator';

@ApiTags('System')
@Controller()
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private mikroOrm: MikroOrmHealthIndicator,
    private readonly configService: ConfigService<AppConfig, true>
  ) {}

  @Endpoint('get', {
    path: 'health',
    summary: 'Health чекер сервисов',
    response: HealthCheckResultDto,
    protected: false
  })
  @HealthCheck()
  async check(): EndpointResponse<HealthCheckResultDto> {
    const host = `${this.configService.get('host')}:${this.configService.get('port')}`;
    const url = host.includes('localhost') ? `http://${host}` : `https://${host}`;
    const checks = [
      { key: 'app', checkFn: async () => this.http.pingCheck('app', url) },
      { key: 'postgres', checkFn: async () => this.mikroOrm.pingCheck('postgres') },
      {
        key: 's3server',
        checkFn: async () =>
          this.http.pingCheck('s3server', this.configService.get('media.s3.config.endpoint', { infer: true }) + '/')
      }
    ];
    const results = {} as HealthCheckResultDto;
    results.status = 'ok';
    for (const { key, checkFn } of checks) {
      try {
        const result = await checkFn();
        results.info = { ...result, ...results.info };
        results.details = { ...result, ...results.details };
      } catch (error: any) {
        const answer = error.causes;
        if (answer[key].statusCode == 403) {
          answer[key].status = 'up' as HealthIndicatorStatus;
          results.info = { ...results.info, [key]: { status: answer[key].status } };
          results.details = { ...results.details, [key]: { status: answer[key].status } };
        } else {
          results.error = { ...answer, ...results.error };
          results.details = { ...answer, ...results.details };
          results.status = 'error';
        }
      }
    }
    return {
      dto: HealthCheckResultDto,
      data: results
    };
  }

  @Endpoint('get', {
    summary: 'дефолтная страница',
    protected: false
  })
  async default(): Promise<EmptyEndpointResponse> {
    //
  }
}
