import Redis from 'ioredis';
import * as dotenv from 'dotenv'; 
dotenv.config(); // access to environment variables

const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  lazyConnect: true,
});

redisClient.on('error', (err: any) => {
  console.error('Redis connection error:', err);
});

redisClient.on('connect', () => {
  console.log('Successfully connected to Redis');
});

export default redisClient;