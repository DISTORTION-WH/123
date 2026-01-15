import './config/env'; 
import express, { RequestHandler } from 'express'; // Импортируем тип
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dbConnection from './config/db';
import authController from './controllers/auth.controller';
import { env } from './config/env';

const app = express();

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  limit: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
}) as unknown as RequestHandler; 

app
  .use(cors())
  .use(express.json())
  .use(limiter);

dbConnection();

app
  .get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', service: 'Auth Microservice' });
  })
  .use('/internal/auth', authController)
  .use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  })
  .use('*', (req, res) => {
    console.log(`404 Hit: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ error: 'Route not found' });
  })
  .listen(env.PORT, () => {
    console.log(`аус воркает ${env.PORT}`);
  });