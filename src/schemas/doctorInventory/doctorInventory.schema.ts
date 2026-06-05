import mongoose, { Document, Schema } from "mongoose";

export interface DoctorInventoryInterface extends Document {
  labDoctor: mongoose.Schema.Types.ObjectId;
  description?: string;
  company: mongoose.Schema.Types.ObjectId;
  createdBy: mongoose.Schema.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

const DoctorInventorySchema = new Schema<DoctorInventoryInterface>({
  labDoctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "LabDoctor",
    required: true,
  },
  description: {
    type: String,
    trim: true,
  },
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

const DoctorInventoryModel = mongoose.model<DoctorInventoryInterface>("DoctorInventory", DoctorInventorySchema);
export default DoctorInventoryModel;
