import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const POSTGRES_HOST = 'localhost';
const POSTGRES_PORT = parseInt(process.env.POSTGRES_PORT || '5432', 10);
const POSTGRES_USER = process.env.POSTGRES_USER || 'innogram_user';
const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD || 'innogram_password';
const POSTGRES_DB = process.env.POSTGRES_DB || 'innogram';

console.log('--------------------------------------------------');
console.log('TypeORM Data Source Configuration:');
console.log(`Host: ${POSTGRES_HOST}`);
console.log(`Port: ${POSTGRES_PORT}`);
console.log(`User: ${POSTGRES_USER}`);
console.log(`DB:   ${POSTGRES_DB}`);
console.log('--------------------------------------------------');

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: POSTGRES_HOST,
  port: POSTGRES_PORT,
  username: POSTGRES_USER,
  password: POSTGRES_PASSWORD,
  database: POSTGRES_DB,
  synchronize: false,
  logging: true,
  entities: [path.join(__dirname, 'entities', '*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, 'migrations', '*{.ts,.js}')],
  subscribers: [],
});
