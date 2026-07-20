"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatabaseConfig = void 0;
const getDatabaseConfig = (configService) => {
    const dbType = configService.get('DB_TYPE') || 'sqlite';
    const isDev = configService.get('NODE_ENV') === 'development';
    switch (dbType) {
        case 'postgres':
            return {
                type: 'postgres',
                host: configService.get('DB_HOST') || 'localhost',
                port: configService.get('DB_PORT') || 5432,
                username: configService.get('DB_USERNAME') || 'etunisia',
                password: configService.get('DB_PASSWORD') || 'etunisia_secret',
                database: configService.get('DB_NAME') || 'etunisia',
                entities: [__dirname + '/../**/*.entity{.ts,.js}'],
                synchronize: isDev || configService.get('DB_SYNCHRONIZE') === 'true',
                logging: isDev,
                ssl: configService.get('DB_SSL') === 'true'
                    ? { rejectUnauthorized: false }
                    : false,
                migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
                migrationsRun: false,
                extra: {
                    max: parseInt(configService.get('DB_POOL_MAX') || '20', 10),
                    min: parseInt(configService.get('DB_POOL_MIN') || '5', 10),
                    acquireTimeoutMillis: 30000,
                    idleTimeoutMillis: 10000,
                },
            };
        case 'mysql':
            return {
                type: 'mysql',
                host: configService.get('DB_HOST') || 'localhost',
                port: configService.get('DB_PORT') || 3306,
                username: configService.get('DB_USERNAME') || 'etunisia',
                password: configService.get('DB_PASSWORD') || 'etunisia_secret',
                database: configService.get('DB_NAME') || 'etunisia',
                entities: [__dirname + '/../**/*.entity{.ts,.js}'],
                synchronize: isDev,
                logging: isDev,
                migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
                migrationsRun: false,
                extra: {
                    max: parseInt(configService.get('DB_POOL_MAX') || '20', 10),
                    min: parseInt(configService.get('DB_POOL_MIN') || '5', 10),
                    acquireTimeoutMillis: 30000,
                    idleTimeoutMillis: 10000,
                },
            };
        case 'sqlite':
        default:
            return {
                type: 'better-sqlite3',
                database: configService.get('SQLITE_DB_PATH') || 'etunisia.db',
                entities: [__dirname + '/../**/*.entity{.ts,.js}'],
                synchronize: true,
                logging: false,
            };
    }
};
exports.getDatabaseConfig = getDatabaseConfig;
//# sourceMappingURL=database.config.js.map