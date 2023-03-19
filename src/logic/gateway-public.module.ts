import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import * as Controllers from './controllers';
import { NotificationModule } from '../notification/notification.module';
import { MediaModule } from '../media/media.module';

@Module({
  providers: [],
  controllers: Object.values(Controllers),
  imports: [TerminusModule, NotificationModule, MediaModule]
})
export class GatewayPublicModule {}
