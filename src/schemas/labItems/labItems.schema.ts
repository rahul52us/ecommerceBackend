import mongoose, { Document, Schema } from "mongoose";

const LabItemSchema = new Schema<any>({
  lab: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lab",
    required: true,
    index: true,
  },
  patientName:{
    type : mongoose.Schema.Types.ObjectId,
    ref : 'User'
  },
  itemName: {
    type: String,
    required: true,
    index: true,
  },
  itemCode: {
    type: String,
  },
  quantity: {
    type: Number,
    default: 0,
  },
  price: {
    type: Number,
  },
  total: {
    type: Number,
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
  createdAt: {
    type: Date,
    default: new Date(),
  },
  deletedAt: {
    type : Date
  }
});

const LabItemModal = mongoose.model<any>("LabItem", LabItemSchema);
export default LabItemModal;