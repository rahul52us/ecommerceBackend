import mongoose, { Document, Schema } from 'mongoose';

export interface IOldData extends Document {
  Patient_Code: string;
  Patient_Name: string;
  Sex: string;
  Age: string;
  Phone: string;
  Email: string;
  Address: string;
  Group: string;
  Registered_On: string;
  Referred_By: string;
  Work_Date: string;
  Doctor: string;
  Treatment_Stage: string;
  Teeth_Count: number;
  Treatments: string;
  Prescriptions: string;
  Fee_Due: number;
  Fee_Discount: number;
  Amount_Paid: number;
  Payment_Modes: string;
  Work_ID: string;
  company?: mongoose.Types.ObjectId;
  user?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const oldDataSchema = new Schema<IOldData>(
  {
    Patient_Code: { type: String },
    Patient_Name: { type: String },
    Sex: { type: String },
    Age: { type: String },
    Phone: { type: String },
    Email: { type: String },
    Address: { type: String },
    Group: { type: String },
    Registered_On: { type: String },
    Referred_By: { type: String },
    Work_Date: { type: String },
    Doctor: { type: String },
    Treatment_Stage: { type: String },
    Teeth_Count: { type: Number, default: 0 },
    Treatments: { type: String },
    Prescriptions: { type: String },
    Fee_Due: { type: Number, default: 0 },
    Fee_Discount: { type: Number, default: 0 },
    Amount_Paid: { type: Number, default: 0 },
    Payment_Modes: { type: String },
    Work_ID: { type: String },
    company: { type: Schema.Types.ObjectId, ref: 'Company' },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate rows if same Excel is uploaded again
// Only applies when Work_ID is non-empty (visit rows)
oldDataSchema.index(
  { Work_ID: 1, company: 1 },
  { unique: true, partialFilterExpression: { Work_ID: { $exists: true, $ne: '' } } }
);

export const OldData = mongoose.model<IOldData>('OldData', oldDataSchema);
