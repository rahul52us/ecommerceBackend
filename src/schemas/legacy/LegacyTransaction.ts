import mongoose, { Schema, Document } from "mongoose";

export interface LegacyTransactionInterface extends Document {
  patientId: Schema.Types.ObjectId;
  doctorId: Schema.Types.ObjectId;
  legacyPatCode: string;
  legacyDocCode: string;
  legacyWrkDoneId?: string;
  fee_rec: number;
  date: Date;
  wrk_date: Date;
  company: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LegacyTransactionSchema: Schema<LegacyTransactionInterface> = new Schema({
  patientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  doctorId: { type: Schema.Types.ObjectId, ref: "User" },
  legacyPatCode: { type: String, required: true, index: true },
  legacyDocCode: { type: String },
  legacyWrkDoneId: { type: String, index: true },
  fee_rec: { type: Number },
  date: { type: Date },
  wrk_date: { type: Date },
  company: { type: Schema.Types.ObjectId, ref: 'Company' },
}, { timestamps: true });

export default mongoose.model<LegacyTransactionInterface>("LegacyTransaction", LegacyTransactionSchema);
