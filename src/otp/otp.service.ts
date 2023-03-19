import { Injectable, Logger } from '@nestjs/common';
import { totp } from 'otplib';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AppConfig } from '../app.config';
import { InjectRedis, Redis } from '@nestjs-modules/ioredis';

export interface OtpInfo {
  code: string;
  email?: string;
}

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  public readonly lifeTime: number;
  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly configService: ConfigService<AppConfig, true>,
    private readonly eventEmitter: EventEmitter2
  ) {
    this.lifeTime = this.configService.get<number>('otp.life', { infer: true });
    totp.options = {
      digits: 6,
      step: this.lifeTime
    };
  }

  public getRedisKey(id: string): string {
    return `totp-${id}`;
  }

  public async check(code: string): Promise<string | null> {
    return this.redis.get(this.getRedisKey(code));
  }

  public async generate(userId: string, token: string, email?: string): Promise<string> {
    const code = totp.generate(userId);

    this.logger.warn(`totp generated for ${email}: ${code}`);

    await this.redis.set(this.getRedisKey(code), token, 'EX', this.lifeTime);
    this.eventEmitter.emit('otp.generated', <OtpInfo>{ code, email });
    return code;
  }
}
