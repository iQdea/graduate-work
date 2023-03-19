import { Job } from 'bullmq';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { MailerService } from '../../notification/mailer.service';
import { OnWorkerEvent } from '@nestjs/bullmq/dist/decorators/on-worker-event.decorator';
import { SMTPError } from 'nodemailer/lib/smtp-connection';
import { Logger } from '@nestjs/common';
import { SentMessageInfo } from 'nodemailer';
import appConfig from '../../app.config';

const { mailerQueue } = appConfig().queues;

@Processor(mailerQueue.name, mailerQueue.workerOptions)
export class MailerJobsProcessor extends WorkerHost {
  private readonly logger = new Logger(MailerJobsProcessor.name);

  constructor(private readonly mailerService: MailerService) {
    super();
  }

  public async process(job: Job): Promise<SentMessageInfo | null> {
    this.logger.log(
      {
        event: 'started',
        jobId: job.id
      },
      MailerJobsProcessor.name
    );
    try {
      return await this.mailerService.send(job.data);
    } catch (error) {
      const smtpError = error as SMTPError;
      this.logger.error(
        {
          event: 'failed',
          jobId: job.id,
          name: (error as Error)?.name,
          message: (error as Error)?.message,
          code: smtpError?.code,
          responseCode: smtpError?.responseCode,
          command: smtpError?.command,
          response: smtpError?.response
        },
        MailerJobsProcessor.name
      );
      return null;
    }
  }

  @OnWorkerEvent('progress')
  async progress(job: Job) {
    this.logger.error(
      {
        event: 'progress',
        jobId: job.id
      },
      MailerJobsProcessor.name
    );
  }

  @OnWorkerEvent('error')
  async error(error: Error) {
    this.logger.error(
      {
        event: 'error',
        name: error.name,
        message: error.message
      },
      MailerJobsProcessor.name
    );
  }

  @OnWorkerEvent('failed')
  async failed(job: Job, error: SMTPError | Error) {
    const smtpError: SMTPError = error;
    this.logger.error(
      {
        event: 'failed',
        jobId: job.id,
        name: error.name,
        message: error.message,
        code: smtpError?.code,
        responseCode: smtpError?.responseCode,
        command: smtpError?.command,
        response: smtpError?.response
      },
      MailerJobsProcessor.name
    );
  }

  @OnWorkerEvent('completed')
  async completed(job: Job, result: SentMessageInfo) {
    this.logger.log(
      {
        event: 'completed',
        jobId: job.id,
        accepted: result?.accepted,
        rejected: result?.rejected
      },
      MailerJobsProcessor.name
    );
  }
}
