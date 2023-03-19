import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { AppConfig } from '../app.config';
import { NotificationModule } from '../notification/notification.module';
import { MailerJobsProcessor } from './processors/mailer';

@Module({
  imports: [
    NotificationModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService<AppConfig, true>) => {
        const redisSettings = configService.get('redis', { infer: true });
        const connection = {
          ...redisSettings
        };

        const CA = configService.get('redisCA', { infer: true });
        if (CA) {
          connection.tls = {
            ca: [CA]
          };
        }

        return {
          connection
        };
      }
    })
  ],
  providers: [MailerJobsProcessor]
})
export class QueueModule {}
