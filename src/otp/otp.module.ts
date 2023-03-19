import { Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { RedisModule } from '@nestjs-modules/ioredis';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppConfig } from '../app.config';

@Module({
  controllers: [],
  imports: [
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService<AppConfig, true>) => ({
        config: configService.get('redis', { infer: true })
      })
    }),
    EventEmitterModule.forRoot()
  ],
  providers: [OtpService],
  exports: [OtpService]
})
export class OtpModule {}
