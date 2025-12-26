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
        required: true,
    },
      treatmentDate: {
        type: Date,
      },
status: {
        type: String,
        enum: ["pending", "in-progress", "completed", "cancelled"],
        default: "pending",
      },


    notes: {
      type: String,
      trim: true,
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
