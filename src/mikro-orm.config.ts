/* eslint-disable node/no-process-env */
import { Configuration, Options } from '@mikro-orm/core';
import { config as envConfig } from 'dotenv';

envConfig();

const config: Options | Configuration = {
  entities: ['./dist/**/*.entity.js', './dist/**/*.embeddable.js'],
  entitiesTs: ['./src/**/*.entity.ts', './src/**/*.embeddable.ts'],
  type: 'postgresql',
  clientUrl: process.env.DATABASE_URL || '',

  migrations: {
    tableName: 'storage_s3_migrations',
    path: './dist/database/migrations',
    pathTs: './src/database/migrations',
    transactional: true,
    disableForeignKeys: false
  },

  schemaGenerator: {
    disableForeignKeys: false
  }
};

export default config;
