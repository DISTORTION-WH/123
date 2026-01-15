import mongoose from 'mongoose';
import { env } from './env';

const dbConnection = async () => {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log('Монго работает');
  } catch (err) {
    console.error('Монго не работает:', err);
    process.exit(1);
  }
};

export default dbConnection;