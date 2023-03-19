import { Controller, Get, Redirect } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, HttpHealthIndicator } from '@nestjs/terminus';

@ApiTags('System')
@Controller()
export class HealthController {
  constructor(private health: HealthCheckService, private http: HttpHealthIndicator) {}

  @Get('health')
  @HealthCheck()
  check() {
    return {
      status: 'ok'
    };
  }

  @Get()
  default() {
    return {};
  }
}
