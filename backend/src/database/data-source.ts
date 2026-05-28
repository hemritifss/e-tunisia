import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

// Load env vars for CLI usage
const envFile = process.env.NODE_ENV === 'production' ? '.env' : '.env';
dotenv.config({ path: envFile });

const dbType = process.env.DB_TYPE || 'postgres';



const isDev = process.env.NODE_ENV === 'development';

export const AppDataSource = new DataSource({
  type: dbType as 'postgres' | 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || (dbType === 'postgres' ? '5432' : '3306'), 10),
  username: process.env.DB_USERNAME || 'etunisia',
  password: process.env.DB_PASSWORD || 'etunisia_secret',
  database: process.env.DB_NAME || 'etunisia',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
  synchronize: isDev,
  logging: isDev,
  ssl:
    process.env.DB_SSL === 'true'
      ? { rejectUnauthorized: false }
      : false,
});
