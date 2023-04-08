/* eslint-disable node/no-process-env */

import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import * as Joi from 'joi';
import * as SMTPTransport from 'nodemailer/lib/smtp-transport';
import Mail from 'nodemailer/lib/mailer';
import { RedisOptions } from 'ioredis';
import { WorkerOptions } from 'bullmq';
import { ResizeOptions } from 'sharp';
import { S3ClientConfig } from '@aws-sdk/client-s3';

export interface QueueOptions {
  name: string;
  workerOptions: WorkerOptions;
}

export interface AppConfig {
  env: string;
  envName: string;
  port: number;
  envUrl: string;
  database: string;
  cors: CorsOptions;
  redis: RedisOptions;
  redisCA?: string;
  otp: {
    life: number;
    timeout: number;
  };
  recovery: {
    life: number;
  };
  notification: {
    mailer: {
      transport: SMTPTransport.Options;
      defaults: Mail.Options;
    };
  };
  queues: Record<string, QueueOptions>;
  axios: {
    timeout: number;
    maxRedirects: number;
  };
  media: {
    selectelCdnBase: string;
    s3: {
      config: S3ClientConfig;
      buckets: Record<string, { value: string; temporary: boolean }>;
    };
    resizeImageBySharp: {
      previewSize: ResizeOptions;
      sizes: Record<string, ResizeOptions & { coefficient: number }>;
    };
    maxFileSizeMegabytes: number;
    mimeTypes: Record<string, string[]>;
  };
  authService: {
    host: string;
    port: string;
  };
}

export function getConfigValidationSchema() {
  return Joi.object({
    NODE_ENV: Joi.string().valid('development', 'production').required(),
    PORT: Joi.number().optional().allow(''),
    REDIS_HOST: Joi.string().optional().allow(''),
    REDIS_PORT: Joi.number().optional().allow(''),
    REDIS_PASSWORD: Joi.string().optional().allow(''),
    REDIS_CA: Joi.string().optional().allow(''),
    DATABASE_URL: Joi.string().required(),
    MEDIA_S3_ACCESS_KEY: Joi.string().required(),
    MEDIA_S3_ACCESS_KEY_ID: Joi.string().required(),
    MEDIA_S3_URL: Joi.string().optional().allow(''),
    MEDIA_S3_REGION: Joi.string().optional().allow(''),
    MEDIA_S3_VERSION: Joi.string().optional().allow(''),
    SELCDN_BASE_URL: Joi.string().optional().allow(''),
    MEDIA_S3_UPLOAD_BUCKET: Joi.string().optional().allow(''),
    MEDIA_S3_IMAGES_BUCKET: Joi.string().optional().allow(''),
    MEDIA_S3_IMAGES_BUCKET_V2: Joi.string().optional().allow(''),
    MAILER_HOST: Joi.string().optional().allow(),
    MAILER_PORT: Joi.number().optional().allow(''),
    MAILER_AUTH_LOGIN: Joi.string().optional().allow(''),
    MAILER_AUTH_PASSWORD: Joi.string().optional().allow(''),
    MAILER_AUTH_TOKEN: Joi.string().optional().allow(''),
    QUEUE_MAILER: Joi.string().optional().allow(''),
    QUEUE_SMS: Joi.string().optional().allow(''),
    QUEUE_PUSH: Joi.string().optional().allow(''),
    OTP_LIFE_TIME: Joi.string().optional().allow(''),
    OTP_TIMEOUT: Joi.string().optional().allow(''),
    RECOVERY_LIFETIME: Joi.string().optional().allow(''),
    AUTH_API_SERVICE_HOST: Joi.string().optional(),
    AUTH_API_SERVICE_PORT: Joi.string().optional()
  });
}

export default (): AppConfig => ({
  env: process.env.NODE_ENV || 'development',
  envName: process.env.GITLAB_ENVIRONMENT_NAME || '',
  port: Number.parseInt(process.env.PORT || '', 10) || 3200,
  envUrl: process.env.GITLAB_ENVIRONMENT_URL || 'http://localhost:3200',
  database: process.env.DATABASE_URL || '',
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number.parseInt(process.env.REDIS_PORT || '', 10) || 6379,
    password: process.env.REDIS_PASSWORD || '',
    tls: process.env.REDIS_CA ? { ca: [process.env.REDIS_CA] } : undefined
  },
  redisCA: process.env.REDIS_CA || '',
  cors: {
    origin: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true
  },
  otp: {
    life: Number.parseInt(process.env.OTP_LIFE_TIME || '', 10) || 90,
    timeout: Number.parseInt(process.env.OTP_TIMEOUT || '', 10) || 30
  },
  recovery: {
    life: Number.parseInt(process.env.RECOVERY_LIFETIME || '', 10) || 90
  },
  notification: {
    mailer: {
      transport: {
        host: process.env.MAILER_HOST || 'smtp.yandex.ru',
        port: Number.parseInt(process.env.MAILER_PORT || '', 10) || 465,
        secure: true,
        auth: process.env.MAILER_AUTH_TOKEN
          ? {
              type: 'OAUTH2',
              user: process.env.MAILER_AUTH_LOGIN || '',
              accessToken: process.env.MAILER_AUTH_TOKEN || ''
            }
          : {
              type: 'LOGIN',
              user: process.env.MAILER_AUTH_LOGIN || '',
              pass: process.env.MAILER_AUTH_PASSWORD || ''
            }
      },
      defaults: {
        from: `No Reply <${process.env.MAILER_AUTH_LOGIN}>`
      }
    }
  },
  axios: {
    timeout: 30_000,
    maxRedirects: 10
  },
  queues: {
    mailerQueue: {
      name: process.env.QUEUE_MAILER
        ? `${process.env.GITLAB_ENVIRONMENT_NAME}_${process.env.QUEUE_MAILER}`
        : `${process.env.GITLAB_ENVIRONMENT_NAME}_mailer_queue`,
      workerOptions: {
        concurrency: 1
      }
    },
    pushQueue: {
      name: process.env.QUEUE_PUSH
        ? `${process.env.GITLAB_ENVIRONMENT_NAME}_${process.env.QUEUE_PUSH}`
        : `${process.env.GITLAB_ENVIRONMENT_NAME}_push_queue`,
      workerOptions: {}
    },
    smsQueue: {
      name: process.env.QUEUE_SMS
        ? `${process.env.GITLAB_ENVIRONMENT_NAME}_${process.env.QUEUE_SMS}`
        : `${process.env.GITLAB_ENVIRONMENT_NAME}_sms_queue`,
      workerOptions: {}
    }
  },
  media: {
    s3: {
      config: {
        credentials: {
          accessKeyId: process.env.MEDIA_S3_ACCESS_KEY_ID || 'accessKey1',
          secretAccessKey: process.env.MEDIA_S3_ACCESS_KEY || 'verySecretKey1'
        },
        region: process.env.MEDIA_S3_REGION || 'us-west-2',
        endpoint: process.env.MEDIA_S3_URL || 'http://127.0.0.1:8000/',
        apiVersion: process.env.MEDIA_S3_VERSION || 'latest',
        forcePathStyle: true
      },
      buckets: {
        images: {
          value: process.env.MEDIA_S3_IMAGES_BUCKET || 'images',
          temporary: false
        },
        docs: {
          value: process.env.MEDIA_S3_DOC_BUCKET || 'docs',
          temporary: false
        },
        tmp: {
          value: process.env.MEDIA_S3_TEMP_BUCKET || 'tmp',
          temporary: true
        }
      }
    },
    selectelCdnBase: process.env.SELCDN_BASE_URL || 'http://localhost:3200/media',
    resizeImageBySharp: {
      previewSize: {
        width: 320,
        height: 320,
        fit: 'fill'
      },
      sizes: {
        s: { fit: 'fill', coefficient: 0.25 },
        m: { fit: 'fill', coefficient: 1 },
        l: { fit: 'fill', coefficient: 2 }
      }
    },
    maxFileSizeMegabytes: 10,
    mimeTypes: {
      image: 'image/jpeg,image/gif,image/png,image/tiff,image/webp'.split(','),
      doc: 'application/pdf'.split(',')
    }
  },
  authService: {
    host: process.env.AUTH_API_SERVICE_HOST as string,
    port: process.env.AUTH_API_SERVICE_PORT as string
  }
});
