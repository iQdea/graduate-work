/* eslint-disable node/no-process-env */

import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import * as Joi from 'joi';
import { ResizeOptions } from 'sharp';
import { S3ClientConfig } from '@aws-sdk/client-s3';

export interface AppConfig {
  env: string;
  envName: string;
  port: number;
  host: string;
  database: string;
  cors: CorsOptions;
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
    maxRangeSize: number;
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
    DATABASE_URL: Joi.string().required(),
    MEDIA_S3_ACCESS_KEY: Joi.string().required(),
    MEDIA_S3_ACCESS_KEY_ID: Joi.string().required(),
    MEDIA_S3_URL: Joi.string().optional().allow(''),
    MEDIA_S3_REGION: Joi.string().optional().allow(''),
    MEDIA_S3_VERSION: Joi.string().optional().allow(''),
    SELCDN_BASE_URL: Joi.string().optional().allow(''),
    MEDIA_S3_UPLOAD_BUCKET: Joi.string().optional().allow(''),
    MEDIA_S3_IMAGES_BUCKET: Joi.string().optional().allow(''),
    AUTH_API_SERVICE_HOST: Joi.string().optional(),
    AUTH_API_SERVICE_PORT: Joi.string().optional()
  });
}

export default (): AppConfig => ({
  env: process.env.NODE_ENV || 'development',
  envName: process.env.GITLAB_ENVIRONMENT_NAME || '',
  host: process.env.GITLAB_ENVIRONMENT_HOST || 'localhost',
  port: Number.parseInt(process.env.PORT || '', 10) || 3200,
  database: process.env.DATABASE_URL || '',
  cors: {
    origin: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true
  },
  axios: {
    timeout: 30_000,
    maxRedirects: 10
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
        videos: {
          value: process.env.MEDIA_S3_IMAGES_BUCKET || 'videos',
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
        width: 500,
        height: 500,
        fit: 'fill'
      },
      sizes: {
        s: { fit: 'fill', coefficient: 0.25 },
        m: { fit: 'fill', coefficient: 1 },
        l: { fit: 'fill', coefficient: 2 }
      }
    },
    maxFileSizeMegabytes: 10,
    maxRangeSize: 1024 * 1024,
    mimeTypes: {
      image: 'image/jpeg,image/gif,image/png,image/tiff,image/webp'.split(','),
      doc: 'application/pdf'.split(','),
      video: 'video/mp4'.split(',')
    }
  },
  authService: {
    host: process.env.AUTH_API_SERVICE_HOST as string,
    port: process.env.AUTH_API_SERVICE_PORT as string
  }
});
