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
  walletBalance?: number;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
}

const UserSchema: Schema<UserInterface> = new Schema<UserInterface>({
  title: {
    type: String
  },
  name: { type: String, trim: true, index:true },
  username: { type: String },
  mobileNumber: { type: String, index: true },
  code: { type: String, index: true, unique: true, required: true, lowercase: true, trim: true },
  company: { type: Schema.Types.ObjectId, ref: 'Company',index:true },
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
  profile_details: { type: Schema.Types.ObjectId, ref: "ProfileDetails", index : true },
  is_active: { type: Boolean, default: false },
  role: {
    type: String,
    enum: ["user", "admin", "superadmin"],
    default: "user",
    index:true
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
    ref: 'User',
    index:true
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
    ref: 'User',
    index:true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index:true
  },
  updatedAt: {
    type: Date,
    index:true
  },
  previousRecord: {
    type: Boolean,
    default: false,
  },
  walletBalance: {
    type: Number,
    default: 0,
    index:true
  },
  resetPasswordToken: {
    type: String,
  },
  resetPasswordExpires: {
    type: Date,
  },
}, { timestamps: true });

UserSchema.index({ company: 1, userType: 1 });

const UserModel = mongoose.model<UserInterface>("User", UserSchema);
export default UserModel;