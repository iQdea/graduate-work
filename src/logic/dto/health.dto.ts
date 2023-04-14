import { Exclude, Expose } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HealthIndicatorResult } from '@nestjs/terminus/dist/health-indicator';
import { HealthCheckStatus } from '@nestjs/terminus/dist/health-check/health-check-result.interface';

@Exclude()
export class HealthCheckResultDto {
  @Expose()
  @ApiProperty()
  status!: HealthCheckStatus;

  @Expose()
  @ApiPropertyOptional()
  info?: HealthIndicatorResult;

  @Expose()
  @ApiPropertyOptional()
  error?: HealthIndicatorResult;

  @Expose()
  @ApiProperty()
  details!: HealthIndicatorResult;
}
