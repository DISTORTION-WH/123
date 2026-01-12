import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/innogram_auth';
    await mongoose.connect(mongoURI);
    console.log('Монго работает');
  } catch (err) {
    console.error('Монго не работает:', err);
    process.exit(1);
  }
};

export default connectDB;