import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

// ВАЖНО: Добавляем <string> после Document, чтобы TypeScript понял, что _id — это строка
export interface IUser extends Document<string> {
  _id: string;
  email: string;
  passwordHash: string;
  username: string;
  displayName?: string;
  birthday?: string;
  bio?: string;
  role: string;
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  // Указываем Mongoose, что _id — это строка, и генерируем её через uuidv4
  _id: { type: String, default: uuidv4 },
  
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  
  displayName: { type: String, required: false },
  birthday: { type: String, required: false },
  bio: { type: String, required: false },
  
  role: { type: String, default: 'User' },
  createdAt: { type: Date, default: Date.now },
});

// Отключаем автоматическое создание виртуального поля 'id', 
// чтобы не путаться между _id (uuid) и id (virtual)
UserSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id; // Если хотите, чтобы на клиент уходил 'id', а _id удалялся
    // Но так как у нас теперь _id это и есть UUID, можно оставить как есть
    // или настроить маппинг по вашему усмотрению.
  }
});

export default mongoose.model<IUser>('User', UserSchema);