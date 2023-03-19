import { OtpSubject } from '../../logic/enums';

export interface OtpInfo {
  userId: string;
  subject: OtpSubject;
  code: string;
  email: string;
}
