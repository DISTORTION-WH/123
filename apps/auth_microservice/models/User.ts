import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  username: string;
  displayName?: string; // вот опшинл
  birthday?: string;    // вот опшинл
  bio?: string;        // вот опшинл
  role: string;
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  
  // Делаем поля необязательными (required: false)
  displayName: { type: String, required: false },
  birthday: { type: String, required: false },
  bio: { type: String, required: false },
  
  role: { type: String, default: 'User' },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IUser>('User', UserSchema);