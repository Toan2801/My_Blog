import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'admin' | 'user';

export interface IUser extends Document {
  email: string;
  name?: string;
  image?: string;
  passwordHash?: string;
  role: UserRole;
  emailVerified?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    name: { type: String },
    image: { type: String },
    passwordHash: { type: String },
    role: { type: String, enum: ['admin', 'user'], default: 'user', required: true },
    emailVerified: { type: Date },
  },
  { timestamps: true, collection: 'users' },
);

export default (mongoose.models.User as mongoose.Model<IUser>) ||
  mongoose.model<IUser>('User', UserSchema);
