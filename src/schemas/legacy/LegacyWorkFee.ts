import mongoose, { Schema, Document } from "mongoose";

export interface LegacyWorkFeeInterface extends Document {
  patientId: Schema.Types.ObjectId;
  doctorId: Schema.Types.ObjectId;
  legacyPatCode: string;
  legacyDocCode: string;
  legacyWrkDoneId?: string;
  wrk_date: Date;
  fee_due: number;
  fee_dis: number;
  treat_stage: string;
  company: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LegacyWorkFeeSchema: Schema<LegacyWorkFeeInterface> = new Schema({
  patientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  doctorId: { type: Schema.Types.ObjectId, ref: "User" },
  legacyPatCode: { type: String, required: true, index: true },
  legacyDocCode: { type: String },
  legacyWrkDoneId: { type: String, index: true },
  wrk_date: { type: Date },
  fee_due: { type: Number },
  fee_dis: { type: Number },
  treat_stage: { type: String },
  company: { type: Schema.Types.ObjectId, ref: 'Company' },
}, { timestamps: true });

export default mongoose.model<LegacyWorkFeeInterface>("LegacyWorkFee", LegacyWorkFeeSchema);
