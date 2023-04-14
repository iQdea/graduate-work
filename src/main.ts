import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost, NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { Logger, LoggerErrorInterceptor } from 'nestjs-pino';
import { ResponseSerializerInterceptor } from './common/interceptors/response-serializer.interceptor';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { expressMiddleware } from 'cls-rtracer';
import { Request } from 'express';
import { v4 as uuid } from 'uuid';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true
  });

  const configService = app.get(ConfigService);
  app.use(
    expressMiddleware({
      requestIdFactory: (req: Request) => (req.id = uuid())
    })
  );
  app.useLogger(app.get(Logger));

  app.useGlobalPipes(new ValidationPipe());

  app.useGlobalInterceptors(
    new ResponseSerializerInterceptor(app.get(Reflector), {
      exposeDefaultValues: true,
      exposeUnsetFields: false
    }),
    new LoggerErrorInterceptor()
  );

  const corsOptions = configService.get('cors');
  app.enableCors(corsOptions);

  app.use(cookieParser());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Storage API')
    .addSecurity('sAccessToken', {
      type: 'apiKey',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      in: 'header',
      name: 'sAccessToken'
    })
    .addSecurity('sIdRefreshToken', {
      type: 'apiKey',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      in: 'header',
      name: 'sIdRefreshToken'
    })
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('swagger', app, swaggerDocument, {
    swaggerOptions: {
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      filter: true,
      docExpansion: 'none'
    }
  });

  app.enableShutdownHooks();

  const { httpAdapter } = app.get(HttpAdapterHost);
  const config = app.get<ConfigService>(ConfigService);
  app.useGlobalFilters(new HttpExceptionFilter(httpAdapter, config));

  // Listen on port
  const port = configService.get('port');
  await app.listen(port);
}

// eslint-disable-next-line promise/catch-or-return,unicorn/prefer-top-level-await
bootstrap();
