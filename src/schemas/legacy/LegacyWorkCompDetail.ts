import mongoose, { Schema, Document } from "mongoose";

export interface LegacyWorkCompDetailInterface extends Document {
  legacyWorkCompId: Schema.Types.ObjectId;
  patientId: Schema.Types.ObjectId;
  doctorId: Schema.Types.ObjectId;
  legacyPatCode: string;
  legacyWrkDoneId: string;
  legacyDocCode: string;
  ToothName: string;
  ToothNo: string;
  Wrk_Done: string;
  Sp_Notes: string;
  ToothNoS: string;
  company: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LegacyWorkCompDetailSchema: Schema<LegacyWorkCompDetailInterface> = new Schema({
  legacyWorkCompId: { type: Schema.Types.ObjectId, ref: "LegacyWorkComp" },
  patientId: { type: Schema.Types.ObjectId, ref: "User" },
  doctorId: { type: Schema.Types.ObjectId, ref: "User" },
  legacyPatCode: { type: String },
  legacyWrkDoneId: { type: String, index: true },
  legacyDocCode: { type: String },
  ToothName: { type: String },
  ToothNo: { type: String },
  Wrk_Done: { type: String },
  Sp_Notes: { type: String },
  ToothNoS: { type: String },
  company: { type: Schema.Types.ObjectId, ref: 'Company' },
}, { timestamps: true });

export default mongoose.model<LegacyWorkCompDetailInterface>("LegacyWorkCompDetail", LegacyWorkCompDetailSchema);
