import mongoose, { Schema, Document } from "mongoose";

export interface UserInterface extends Document {
  title: String;
  name: string;
  mobileNumber: string;
  username: string;
  code: string;
  pic: any;
  bio?: string;
  designation?: string[];
  company: Schema.Types.ObjectId;
  profile_details: Schema.Types.ObjectId;
  is_active: boolean;
  role: string;
  userType: string;
  createdBy: Schema.Types.ObjectId;
  password: string;
  deletedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  permissions?: any
  references?: {
    refrenceBy: any;
    refrenceNote: string;
  }[];
  refrenceBy?: any;
  refrenceNote?: string;
  previousRecord?: boolean;
}

const UserSchema: Schema<UserInterface> = new Schema<UserInterface>({
  title: {
    type: String
  },
  name: { type: String, trim: true },
  username: { type: String },
  mobileNumber: { type: String, index: true },
  code: { type: String, index: true, unique: true, required: true },
  company: { type: Schema.Types.ObjectId, ref: 'Company' },
  userType: { type: String, required: true, index: true, trim: true },
  pic: {
    name: {
      type: String
    },
    url: {
      type: String,
    },
    type: {
      type: String,
    },
  },
  bio: { type: String, trim: true },
  profile_details: { type: Schema.Types.ObjectId, ref: "ProfileDetails" },
  is_active: { type: Boolean, default: false },
  role: {
    type: String,
    enum: ["user", "admin", "superadmin"],
    default: "user"
  },
  permissions: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  password: { type: String, trim: true },
  references: [{
    refrenceBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    refrenceNote: {
      type: String,
      trim: true
    }
  }],
  refrenceBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  refrenceNote: {
    type: String,
    trim: true
  },
  deletedAt: {
    type: Date,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
  },
  previousRecord: {
    type: Boolean,
    default: false,
  },
});

const UserModel = mongoose.model<UserInterface>("User", UserSchema);
export default UserModel;