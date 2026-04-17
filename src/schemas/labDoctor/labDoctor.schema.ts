import mongoose, { Document, Schema } from "mongoose";

export interface LabDoctorInterface extends Document {
  labDoctorName: string;
  dob?: Date;
  gender?: number; // 1 for Male, 2 for Female, etc.
  languages?: string[];
  address?: string;
  mobileNumber?: string;
  email?: string;
  pic?: {
    name?: string;
    url?: string;
    type?: string;
  };
  staffDetails?: {
    name: string;
    email: string;
    address: string;
    phone?: string;
  }[];
  company: mongoose.Schema.Types.ObjectId;
  createdBy: mongoose.Schema.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

const LabDoctorSchema = new Schema<LabDoctorInterface>({
  labDoctorName: {
    type: String,
    required: true,
    trim: true,
  },
  dob: {
    type: Date,
  },
  gender: {
    type: Number, // 1 for Male, 2 for Female, etc.
  },
  languages: {
    type: [String],
    default: [],
  },
  address: {
    type: String,
    trim: true,
  },
  mobileNumber: {
    type: String,
    index: true,
  },
  email: {
    type: String,
    trim: true,
  },
  pic: {
    name: { type: String },
    url: { type: String },
    type: { type: String },
  },
  staffDetails: [
    {
      name: { type: String },
      email: { type: String },
      address: { type: String },
      phone: { type: String },
    },
  ],
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
  },
  deletedAt: {
    type: Date,
  },
});

const LabDoctorModel = mongoose.model<LabDoctorInterface>("LabDoctor", LabDoctorSchema);
export default LabDoctorModel;
