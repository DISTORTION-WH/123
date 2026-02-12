import mongoose from 'mongoose';
import { env } from './env';

const dbConnection = async () => {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection failed:', err);
    process.exit(1);
  }
};

export default dbConnection;