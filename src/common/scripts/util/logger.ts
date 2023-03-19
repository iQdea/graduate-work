import pino from 'pino';
import { multistream } from 'pino-multi-stream';
import { config as envConfig } from 'dotenv';

envConfig();

// eslint-disable-next-line node/no-process-env
const env = process.env.NODE_ENV || 'development';
const isDev = env === 'development';
const isTest = env === 'test';

const stream = isTest
  ? {
      write: (log: any) => {
        if (log?.message) {
          // eslint-disable-next-line no-console
          console.log(log.message);
        } else {
          // eslint-disable-next-line no-console
          console.log(log);
        }
      }
    }
  : multistream(
      [
        { level: 'trace', stream: process.stdout },
        { level: 'debug', stream: process.stdout },
        { level: 'info', stream: process.stdout },
        { level: 'warn', stream: process.stdout },
        { level: 'error', stream: process.stderr },
        { level: 'fatal', stream: process.stderr }
      ],
      { dedupe: true }
    );

export const scriptLogger = pino(
  {
    level: 'trace',
    transport:
      isDev || isTest
        ? {
            target: 'pino-pretty',
            options: {
              translateTime: true,
              ignore: 'pid,hostname'
            }
          }
        : undefined
  },
  stream
);
