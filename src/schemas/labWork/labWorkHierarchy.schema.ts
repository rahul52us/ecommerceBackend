import mongoose, { Schema, Document } from "mongoose";

export interface ILabWorkHierarchy extends Document {
  name: string;
  parent?: mongoose.Types.ObjectId;
  company: mongoose.Types.ObjectId;
  isTextInput: boolean;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;

  deletedAt?: Date;
}

const LabWorkHierarchySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    parent: {
      type: Schema.Types.ObjectId,
      ref: "LabWorkHierarchy",
      default: null,
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    isTextInput: {
      type: Boolean,
      default: false,
    },
    isActive: {

      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for performance
LabWorkHierarchySchema.index({ company: 1, parent: 1, isActive: 1 });

export default mongoose.model<ILabWorkHierarchy>("LabWorkHierarchy", LabWorkHierarchySchema);
