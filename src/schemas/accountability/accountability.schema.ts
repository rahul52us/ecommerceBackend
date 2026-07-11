import mongoose, { Schema } from "mongoose";

const AccountabilitySchema = new Schema(
  {
    workDone: {
      type: Schema.Types.ObjectId,
      ref: "WorkDone",
      required: true,
      index: true,
    },
    doctor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    patient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    tooth: {
      type: String,
    },
    treatmentName: {
      type: String,
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    doctorShareAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    doctorSharePercentage: {
      type: Number,
      default: 0,
    },
    payoutStatus: {
      type: String,
      enum: ["PENDING", "PAID", "CANCELLED"],
      default: "PENDING",
    },
    payoutDate: {
      type: Date,
    },
    note: {
      type: String,
      trim: true,
    },
    payoutHistory: [
      {
        amount: Number,
        date: { type: Date, default: Date.now },
        paymentMethod: String,
        receiptNumber: String,
      }
    ],
    lastAccountabilityAmountUpdated: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Accountability", AccountabilitySchema);
