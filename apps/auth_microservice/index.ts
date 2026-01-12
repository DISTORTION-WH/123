import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db';
import authController from './controllers/auth.controller';

// Загрузка переменных окружения
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Подключение к базе данных (MongoDB)
connectDB();

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'Auth Microservice' });
});

// ВАЖНОЕ ИСПРАВЛЕНИЕ ЗДЕСЬ:
app.use('/internal/auth', authController);

// Глобальная обработка ошибок
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Обработка 404 (поможет понять, если путь неверный)
app.use('*', (req, res) => {
    console.log(`404 Hit: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ error: 'Route not found' });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Auth Microservice running on port ${PORT}`);
});