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
      required: true
    },
    treatment: {
      type: Schema.Types.ObjectId,
      ref: "ToothTreatment",
      required: false,
    },
    examiningDoctor: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    tooth: {
      type: String,
      index: true,
    },
    toothNotation: {
      type: String,
      default: "fdi",
    },
    dentitionType: {
      type: String,
      enum: ["adult", "child"],
      default: "adult",
    },
    position: {
      type: String, // 'upper' or 'lower'
    },
    side: {
      type: String, // 'left' or 'right'
    },
    toothNote: {
      type: String,
      trim: true,
    },
    recordType: {
      type: String,
      enum: ["tooth", "note"],
      default: "tooth",
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
    receivedAmount: {
      type: Number,
      default: 0,
    },
    paymentHistory: [
      {
        amount: Number,
        date: { type: Date, default: Date.now },
        note: String,
      }
    ],
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