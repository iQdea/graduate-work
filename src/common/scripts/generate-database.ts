import 'reflect-metadata';
import { MikroORM } from '@mikro-orm/core';
import { DatabaseSeeder } from '../database/seeder';
import config from '../../mikro-orm.config';
import { scriptLogger } from './util/logger';

async function init() {
  return MikroORM.init(config);
}

// eslint-disable-next-line unicorn/prefer-top-level-await
(async () => {
  try {
    scriptLogger.info('[schema generator]: ORM initialization...');
    const orm = await init();
    const generator = orm.getSchemaGenerator();

    // Drop schema
    await generator.dropSchema({ wrap: false });
    scriptLogger.info('[schema generator]: old schema dropped');

    // Add extensions
    await generator.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"', {
      wrap: false
    });
    await generator.execute('CREATE EXTENSION IF NOT EXISTS "postgis"', {
      wrap: false
    });
    scriptLogger.info('[schema generator]: extensions created');

    // Generate schema
    await generator.createSchema({ wrap: false });
    scriptLogger.info('[schema generator]: new schema created');

    // Run seeder
    const seeder = orm.getSeeder();
    await seeder.seed(DatabaseSeeder);
    scriptLogger.info('[schema generator]: seeding finished');

    await orm.close(true);
    scriptLogger.info('[schema generator]: database is ready. Bye!');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error);
    // eslint-disable-next-line unicorn/no-process-exit
    process.exit(1);
  }
})();
