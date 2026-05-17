import mongoose, { Schema } from "mongoose";

const ToothTreatmentSchema = new Schema(
  {
    patient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    doctor: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },

    examiningDoctor: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },

    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    tooth: {
      type: String,
      required: true,
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

    treatmentPlan: {
      type: String,
      required: false,
    },
    treatmentDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["pending", "in-progress", "complete", "completed", "incomplete", "cancelled"],
      default: "pending",
      lowercase: true,
    },
    recordType: {
      type: String,
      enum: ["tooth", "note"],
      default: "tooth",
    },

    notes: {
      type: String,
      trim: true,
    },

    estimateMin: {
      type: Number,
      default: 0,
    },
    estimateMax: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    totalMin: {
      type: Number,
      default: 0,
    },
    totalMax: {
      type: Number,
      default: 0,
    },
    toothNote: {
      type: String,
      trim: true,
    },
    complaintType: {
      type: String,
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
    deletedAt: {
      type: Date
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
  }
);

export default mongoose.model(
  "ToothTreatment",
  ToothTreatmentSchema
);
