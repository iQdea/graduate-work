import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import * as Controllers from './controllers';
import { MediaModule } from '../media/media.module';

@Module({
  providers: [],
  controllers: Object.values(Controllers),
  imports: [TerminusModule, MediaModule]
})
export class GatewayPublicModule {}
