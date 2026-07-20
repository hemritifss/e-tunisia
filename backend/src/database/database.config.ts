import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const dbType = configService.get<string>('DB_TYPE') || 'sqlite';
  const isDev = configService.get<string>('NODE_ENV') === 'development';

  switch (dbType) {
    case 'postgres':
      return {
        type: 'postgres',
        host: configService.get<string>('DB_HOST') || 'localhost',
        port: configService.get<number>('DB_PORT') || 5432,
        username: configService.get<string>('DB_USERNAME') || 'etunisia',
        password: configService.get<string>('DB_PASSWORD') || 'etunisia_secret',
        database: configService.get<string>('DB_NAME') || 'etunisia',
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        // Dev auto-syncs. In prod, opt-in with DB_SYNCHRONIZE=true — needed on a
        // fresh managed DB (e.g. free Render/Neon Postgres) where no migrations exist
        // yet, so TypeORM creates the schema from the entities on first boot.
        synchronize: isDev || configService.get<string>('DB_SYNCHRONIZE') === 'true',
        logging: isDev,
        ssl:
          configService.get<string>('DB_SSL') === 'true'
            ? { rejectUnauthorized: false }
            : false,
        migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
        migrationsRun: false, // Run migrations explicitly via CLI
        extra: {
          // Connection pool settings for production
          max: parseInt(configService.get<string>('DB_POOL_MAX') || '20', 10),
          min: parseInt(configService.get<string>('DB_POOL_MIN') || '5', 10),
          acquireTimeoutMillis: 30000,
          idleTimeoutMillis: 10000,
        },
      };

    case 'mysql':
      return {
        type: 'mysql',
        host: configService.get<string>('DB_HOST') || 'localhost',
        port: configService.get<number>('DB_PORT') || 3306,
        username: configService.get<string>('DB_USERNAME') || 'etunisia',
        password: configService.get<string>('DB_PASSWORD') || 'etunisia_secret',
        database: configService.get<string>('DB_NAME') || 'etunisia',
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        synchronize: isDev,
        logging: isDev,
        migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
        migrationsRun: false,
        extra: {
          max: parseInt(configService.get<string>('DB_POOL_MAX') || '20', 10),
          min: parseInt(configService.get<string>('DB_POOL_MIN') || '5', 10),
          acquireTimeoutMillis: 30000,
          idleTimeoutMillis: 10000,
        },
      };

    case 'sqlite':
    default:
      return {
        type: 'better-sqlite3',
        database: configService.get<string>('SQLITE_DB_PATH') || 'etunisia.db',
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        synchronize: true,
        logging: false,
      };
  }
};
