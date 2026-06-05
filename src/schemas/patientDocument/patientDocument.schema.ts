import mongoose, { Schema, Document } from "mongoose";

export interface PatientDocumentInterface extends Document {
  patient: Schema.Types.ObjectId;
  company: Schema.Types.ObjectId;
  title: string;
  type: "image" | "video" | "document" | "other";
  url: string;
  createdBy: Schema.Types.ObjectId;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const PatientDocumentSchema = new Schema<PatientDocumentInterface>(
  {
    patient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      required: true,
    },
    type: {
      type: String,
      enum: ["image", "video", "document", "other"],
      default: "other",
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const PatientDocumentModel = mongoose.model<PatientDocumentInterface>(
  "PatientDocument",
  PatientDocumentSchema
);

export default PatientDocumentModel;
