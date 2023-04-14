import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { LoggerModule } from 'nestjs-pino';
import { Request, Response } from 'express';
import { HttpModule } from '@nestjs/axios';
import config, { AppConfig, getConfigValidationSchema } from './app.config';
import { GatewayPublicModule } from './logic/gateway-public.module';
import { MediaModule } from './media/media.module';
import { QueueModule } from './queue/queue.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { multistream } from 'pino';
import { NotificationModule } from './notification/notification.module';
import { MetricsController } from './logic/controllers';

const ignoredPaths = new Set(['/health', '/metrics', '/favicon.ico']);

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [config],
      validationSchema: getConfigValidationSchema()
    }),
    LoggerModule.forRoot({
      pinoHttp: [
        {
          autoLogging: {
            ignore: (req) => {
              return !!req.url && ignoredPaths.has(req.url);
            }
          },
          serializers: {
            req: (req: Request) => ({
              id: req.id,
              method: req.method,
              url: req.url
            }),
            res: (res: Response) => ({
              statusCode: res.statusCode
            })
          }
        },
        multistream(
          [
            { level: 'trace', stream: process.stdout },
            { level: 'debug', stream: process.stdout },
            { level: 'info', stream: process.stdout },
            { level: 'warn', stream: process.stdout },
            { level: 'error', stream: process.stderr },
            { level: 'fatal', stream: process.stderr }
          ],
          { dedupe: true }
        )
      ]
    }),
    PrometheusModule.register({
      controller: MetricsController
    }),
    MikroOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig, true>) => {
        return {
          debug: configService.get('env', { infer: true }) === 'development',
          type: 'postgresql',
          autoLoadEntities: true,
          clientUrl: configService.get('database', { infer: true })
        };
      }
    }),
    TerminusModule,
    GatewayPublicModule,
    MediaModule,
    NotificationModule,
    QueueModule,
    HttpModule
  ],
  controllers: [],
  providers: []
})
export class AppModule {}
