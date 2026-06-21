import mongoose, { Schema } from "mongoose";

const ReceiptSchema = new Schema(
  {
    receiptNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    patient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    workDone: {
      type: Schema.Types.ObjectId,
      ref: "WorkDone",
      required: true,
    },
    accountability: {
      type: Schema.Types.ObjectId,
      ref: "Accountability",
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    generatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    type: {
      type: String,
      default: "receipt",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Receipt", ReceiptSchema);
