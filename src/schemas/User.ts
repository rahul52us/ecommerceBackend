import mongoose, { Schema, Document } from "mongoose";

export interface UserInterface extends Document {
  name: string;
  email?: string;
  phone: string;
  gender: string;
  pic: string;
  bio?: string;
  company: Schema.Types.ObjectId;
  isActive: boolean;
  type: string;
  password?: string;
  deletedAt?:Date,
  createdAt?:Date,
  updatedAt?:Date
}

const UserSchema: Schema<UserInterface> = new Schema<UserInterface>(
  {
    name: { type: String, trim: true },
    email: { type: String },
    phone: { type: String, required: true},
    pic: { type: String, trim: true },
    gender : { type: String, default: "male" },
    company: { type: Schema.Types.ObjectId, ref: "Company" },
    bio: { type: String, trim: true },
    isActive: { type: Boolean, default: false },
    type: {
      type: String,
      enum: ["user", "admin", "superAdmin"],
      default: "user",
    },
    password: { type: String, trim: true },
    deletedAt:{
      type : Date
    },
    createdAt:{
      type : Date,
      default : new Date()
    },
    updatedAt:{
      type : Date
    }
  }
);

const UserModel = mongoose.model<UserInterface>("User", UserSchema);

export default UserModel;
