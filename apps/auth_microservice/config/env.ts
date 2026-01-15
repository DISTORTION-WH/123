import * as dotenv from 'dotenv';
import * as path from 'path';

// Если .env файл лежит в корне монорепозитория (на 3 уровня выше), указываем путь явно.
// Если он копируется в корень докера или лежит рядом при разработке - просто dotenv.config()
dotenv.config({ path: path.resolve(__dirname, '../../../.env') }); 

// Можно также добавить проверку наличия критических переменных
const requiredEnvVars = ['MONGO_URI', 'REDIS_HOST', 'JWT_ACCESS_SECRET'];
requiredEnvVars.forEach((key) => {
  if (!process.env[key]) {
    console.warn(`WARNING: Environment variable ${key} is missing!`);
  }
});

export const env = {
  PORT: process.env.PORT || 3002,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/innogram_auth',
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379'),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'access-secret',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
  CORE_SERVICE_URL: process.env.CORE_SERVICE_URL || 'http://localhost:3001',
};