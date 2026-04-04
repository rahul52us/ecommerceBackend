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
      fdi: {
        type: String,
        required: true,
        index: true,
      },
      universal: String,
      palmer: String,
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
      enum: ["pending", "in-progress", "completed", "cancelled"],
      default: "pending",
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
      default: new Date(),
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
