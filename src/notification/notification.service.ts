import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { MailerService } from './mailer.service';
import { OnEvent } from '@nestjs/event-emitter';
import { OtpInfo } from '../otp/interfaces';
import { OtpSubject } from '../logic/enums';
import { MailerParams } from './interfaces';
@Injectable()
export class NotificationService {
  constructor(private readonly mailerService: MailerService) {}

  public async sendMail(params: MailerParams): Promise<Job> {
    return this.mailerService.addJob(params);
  }

  @OnEvent('otp.generated', { async: true })
  public async sendCodeOnEMail(otpInfo: OtpInfo) {
    let title: string = 'default';
    let template: string = 'default';
    let data = {};
    switch (otpInfo.subject) {
      case OtpSubject.NEW_IMAGE: {
        title = 'Подтверждение регистрации';
        template = 'registration-accept';
        data = { otp_code: otpInfo.code };
        break;
      }
      case OtpSubject.EDIT_IMAGE: {
        title = 'Смена пароля';
        template = 'change-password';
        data = { otp_code: otpInfo.code };
        break;
      }
    }
    await this.sendMail({
      recipients: [otpInfo.email],
      data,
      title,
      template
    });
  }
}
