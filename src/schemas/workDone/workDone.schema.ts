import mongoose, { Schema } from "mongoose";

const WorkDoneSchema = new Schema(
  {
    patient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    doctor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    treatment: {
      type: Schema.Types.ObjectId,
      ref: "ToothTreatment",
      required: false,
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    complaintType: {
      type: String,
      trim: true,
    },
    workDoneNote: {
      type: String,
      trim: true,
    },
    amount: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    treatmentCode: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["COMPLETE", "PENDING", "INCOMPLETE"],
      default: "COMPLETE",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    deletedAt: {
      type: Date,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("WorkDone", WorkDoneSchema);
