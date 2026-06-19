import mongoose, { Schema, Document } from "mongoose";

export interface LegacyToothWorkInterface extends Document {
  patientId: Schema.Types.ObjectId;
  doctorId: Schema.Types.ObjectId;
  legacyPatCode: string;
  legacyDocCode: string;
  legacyWrkDoneId?: string;
  name: string;
  descript: string;
  wrkdate: Date;
  ToothNoS: string;
  isVersion1: boolean;
  company: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LegacyToothWorkSchema: Schema<LegacyToothWorkInterface> = new Schema({
  patientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  doctorId: { type: Schema.Types.ObjectId, ref: "User" },
  legacyPatCode: { type: String, required: true, index: true },
  legacyDocCode: { type: String },
  legacyWrkDoneId: { type: String, index: true },
  name: { type: String },
  descript: { type: String },
  wrkdate: { type: Date },
  ToothNoS: { type: String },
  isVersion1: { type: Boolean, default: false }, // For toothwrk1
  company: { type: Schema.Types.ObjectId, ref: 'Company' },
}, { timestamps: true });

export default mongoose.model<LegacyToothWorkInterface>("LegacyToothWork", LegacyToothWorkSchema);
