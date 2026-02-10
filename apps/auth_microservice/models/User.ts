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
  virtuals: true, //mongo will create a virtual field, in our case it is the ID we need, not _id
  versionKey: false, //destroy the version key we dont need
  transform: function (doc, ret) {
    delete ret._id; //we dont need the _id field because we created a virtual id
  }
});

export default mongoose.model<IUser>('User', UserSchema);