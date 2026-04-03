import mongoose, { Document, Schema } from "mongoose";

const DealerSchema = new Schema<any>({
  name: {
    type: String,
    required: true,
  },
  addresses: {
    type: mongoose.Schema.Types.Mixed,
  },
  staffs: [
    {
      name: {
        type: String
      },
      email: {
        type: String,
      },
      phone: {
        type: String,
      },
    },
  ],
  bankAccounts: {
    type: mongoose.Schema.Types.Mixed,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  deletedAt : {
    type : Date
  },
  createdAt: {
    type: Date,
    default: new Date(),
  },
});

const DealerModal = mongoose.model<any>("Dealer", DealerSchema);
export default DealerModal;
