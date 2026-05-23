import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { EnvConfig } from '@/config';
import { DATABASE_CONNECTION } from './constants';
import {
  UsersRepository,
  SessionsRepository,
  SeatsRepository,
  BookingsRepository,
  PaymentsRepository,
} from './repositories';

export { DATABASE_CONNECTION };
export type { Database } from './constants';

const repositories = [
  UsersRepository,
  SessionsRepository,
  SeatsRepository,
  BookingsRepository,
  PaymentsRepository,
];

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_CONNECTION,
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvConfig, true>) => {
        const pool = new Pool({
          host: config.get('DATABASE_HOST'),
          port: config.get('DATABASE_PORT'),
          database: config.get('DATABASE_NAME'),
          user: config.get('DATABASE_USER'),
          password: config.get('DATABASE_PASSWORD'),
          ssl: config.get('DATABASE_SSL') === 'true' ? { rejectUnauthorized: false } : false,
        });
        return drizzle(pool, { schema });
      },
    },
    ...repositories,
  ],
  exports: [DATABASE_CONNECTION, ...repositories],
})
export class DatabaseModule {}
