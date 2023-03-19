import path from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { MailerModule } from '@nestjs-modules/mailer';
import * as SMTPTransport from 'nodemailer/lib/smtp-transport';
import Mail from 'nodemailer/lib/mailer';
import { NotificationService } from './notification.service';
import { MailerService } from './mailer.service';
import appConfig from '../app.config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PugAdapter } from '@nestjs-modules/mailer/dist/adapters/pug.adapter';

const { mailerQueue, pushQueue, smsQueue } = appConfig().queues;

@Module({
  imports: [
    BullModule.registerQueueAsync(
      {
        name: mailerQueue.name
      },
      {
        name: pushQueue.name
      },
      {
        name: smsQueue.name
      }
    ),
    EventEmitterModule.forRoot(),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: configService.get<SMTPTransport.Options>('notification.mailer.transport'),
        defaults: configService.get<Mail.Options>('notification.mailer.defaults'),
        template: {
          dir: path.join(__dirname, 'templates/pages'),
          adapter: new PugAdapter(),
          options: {
            strict: true
          }
        }
      })
    })
  ],
  providers: [NotificationService, MailerService],
  exports: [NotificationService, MailerService]
})
export class NotificationModule {}
