import mongoose, { Schema } from "mongoose";

const ProcedureSchema = new Schema(
  {
    category: {
      type: String,
      required: true,
      index: true,
    },
    subcategory: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      index: true,
    },
    name2: {
      type: String,
    },
    name3: {
      type: String,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    deletedAt: {
      type: Date,
    },
    createdAt: {
      type: Date,
      default: Date.now,
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

export default mongoose.models.Procedure || mongoose.model("Procedure", ProcedureSchema);
