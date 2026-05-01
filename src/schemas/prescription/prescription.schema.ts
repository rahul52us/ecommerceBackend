import mongoose, { Schema, Document } from "mongoose";

export interface IPrescription extends Document {
  type: string;
  category: string;
  form: string;
  basicSalt: string;
  brandName: string;
  companyName: string;
  dosage: string;
  details: string;
  doseNo: number;
  description: string;
  createdBy?: mongoose.Types.ObjectId;
  company?: mongoose.Types.ObjectId;
}

const PrescriptionSchema: Schema = new Schema(
  {
    type: { type: String, required: true },
    category: { type: String },
    form: { type: String },
    basicSalt: { type: String },
    brandName: { type: String, required: true },
    companyName: { type: String },
    dosage: { type: String },
    details: { type: String },
    doseNo: { type: Number, default: 0 },
    description: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    company: { type: Schema.Types.ObjectId, ref: "Company" },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Prescription ||
  mongoose.model<IPrescription>("Prescription", PrescriptionSchema);
