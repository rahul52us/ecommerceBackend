import mongoose, { Schema, Document } from "mongoose";

export interface IPatientPrescriptionItem {
  type?: string;
  category?: string;
  form?: string;
  basicSalt?: string;
  brandName: string;
  companyName?: string;
  dosage?: string;
  details?: string;
  doseNo?: number;
  noOfDays?: number;
  description?: string;
}

export interface IPatientPrescription extends Document {
  patient: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  prescriptions: IPatientPrescriptionItem[];
  company: mongoose.Types.ObjectId;
}

const PatientPrescriptionSchema = new Schema(
  {
    patient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: {
      type: String, // format: YYYY-MM-DD
      required: true,
      index: true,
    },
    prescriptions: {
      type: [Schema.Types.Mixed],
      default: [],
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure uniqueness per patient per date
PatientPrescriptionSchema.index({ patient: 1, date: 1 }, { unique: true });

export default mongoose.models.PatientPrescription ||
  mongoose.model<IPatientPrescription>("PatientPrescription", PatientPrescriptionSchema);
