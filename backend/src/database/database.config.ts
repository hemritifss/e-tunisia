import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const dbType = configService.get<string>('DB_TYPE') || 'sqlite';

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
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
        logging: configService.get<string>('NODE_ENV') === 'development',
        ssl:
          configService.get<string>('DB_SSL') === 'true'
            ? { rejectUnauthorized: false }
            : false,
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
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
        logging: configService.get<string>('NODE_ENV') === 'development',
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
