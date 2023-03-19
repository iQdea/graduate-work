import { Injectable } from '@nestjs/common';
import { MailerService as NestjsMailerService } from '@nestjs-modules/mailer';
import { SentMessageInfo } from 'nodemailer';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import appConfig from '../app.config';
import { MailerParams } from './interfaces';

const { mailerQueue } = appConfig().queues;

@Injectable()
export class MailerService {
  constructor(
    private readonly nestjsMailerService: NestjsMailerService,
    @InjectQueue(mailerQueue.name)
    private readonly mailerJobsQueue: Queue
  ) {}

  public async addJob(params: MailerParams) {
    return this.mailerJobsQueue.add('mailerSend', params, {
      attempts: 1,
      removeOnComplete: true,
      removeOnFail: true
    });
  }

  public async send(params: MailerParams): Promise<SentMessageInfo> {
    return this.nestjsMailerService.sendMail({
      to: params.recipients,
      subject: params.title,
      template: `${params.template || 'default'}.pug`,
      context: {
        cache: true,
        ...params.data
      }
    });
  }
}
