import './config/env'; 
import express from 'express';
import cors from 'cors';
import connectDB from './config/db';
import authController from './controllers/auth.controller';
import { env } from './config/env';

const app = express();

app
  .use(cors())
  .use(express.json());

connectDB();

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