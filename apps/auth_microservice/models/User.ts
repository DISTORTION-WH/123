import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

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


UserSchema.set('toJSON', {
  virtuals: true, //монго создаст виртуальное поле, в нашем случае речь о id которое нам нужно,а не _id
  versionKey: false, //уничтожить нам не нужный ключ версий
  transform: function (doc, ret) {
    delete ret._id; //нам не нужно поле _id потому что мы создали виртуальное id
  }
});

export default mongoose.model<IUser>('User', UserSchema);