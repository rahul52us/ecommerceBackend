import mongoose, { Document, Schema } from "mongoose";

const LabSchema = new Schema<any>({
  name: {
    type: String,
    required: true,
  },
  addresses: {
    type: mongoose.Schema.Types.Mixed,
  },
  staffs: [
    {
      name: {
        type: String,
        required: true,
      },
      email: {
        type: String,
      },
      phone: {
        type: String,
      },
    },
  ],
  bankAccounts: {
    type: mongoose.Schema.Types.Mixed,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  deletedAt : {
    type : Date
  },
  createdAt: {
    type: Date,
    default: new Date(),
  },
});

const LabModal = mongoose.model<any>("Lab", LabSchema);
export default LabModal;