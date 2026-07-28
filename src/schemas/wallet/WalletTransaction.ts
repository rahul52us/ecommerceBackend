import mongoose, { Schema, Document } from "mongoose";

export interface WalletTransactionInterface extends Document {
  patient: Schema.Types.ObjectId;
  amount: number;
  type: string; // 'Deposit' or 'Withdrawal'
  paymentMethod?: string;
  workDone?: Schema.Types.ObjectId;
  company: Schema.Types.ObjectId;
  createdBy: Schema.Types.ObjectId;
  description?: string;
  date?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const WalletTransactionSchema: Schema<WalletTransactionInterface> = new Schema<WalletTransactionInterface>(
  {
    patient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ["Deposit", "Withdrawal"],
      required: true,
    },
    paymentMethod: {
      type: String,
      trim: true,
    },
    workDone: {
      type: Schema.Types.ObjectId,
      ref: "WorkDone",
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<WalletTransactionInterface>("WalletTransaction", WalletTransactionSchema);
