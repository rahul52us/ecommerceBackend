import mongoose, { Schema, Document } from "mongoose";

export interface LegacyWorkCompInterface extends Document {
  patientId: Schema.Types.ObjectId;
  doctorId: Schema.Types.ObjectId;
  legacyWrkDoneId: string;
  legacyPatCode: string;
  legacyDocCode: string;
  wrk_date: Date;
  fee_due: number;
  fee_dis: number;
  treat_stage: string;
  isVersion1: boolean;
  company: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LegacyWorkCompSchema: Schema<LegacyWorkCompInterface> = new Schema({
  patientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  doctorId: { type: Schema.Types.ObjectId, ref: "User" },
  legacyWrkDoneId: { type: String, index: true },
  legacyPatCode: { type: String, required: true },
  legacyDocCode: { type: String },
  wrk_date: { type: Date },
  fee_due: { type: Number },
  fee_dis: { type: Number },
  treat_stage: { type: String },
  isVersion1: { type: Boolean, default: false },
  company: { type: Schema.Types.ObjectId, ref: 'Company' },
}, { timestamps: true });

export default mongoose.model<LegacyWorkCompInterface>("LegacyWorkComp", LegacyWorkCompSchema);
