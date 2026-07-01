import mongoose, { Document } from "mongoose";

export interface AdvertisementI extends Document {
  title: string;
  link: string;
  image: {
    name: string;
    url: string;
    type: string;
  };
  validFrom: Date;
  validTo: Date;
  status: boolean;
  company: mongoose.Schema.Types.ObjectId;
  createdBy: mongoose.Schema.Types.ObjectId;
}

const AdvertisementSchema = new mongoose.Schema<AdvertisementI>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    link: {
      type: String,
      trim: true,
    },
    image: {
      name: { type: String },
      url: { type: String },
      type: { type: String },
    },
    validFrom: {
      type: Date,
      required: true,
    },
    validTo: {
      type: Date,
      required: true,
    },
    status: {
      type: Boolean,
      default: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "Organisation is required"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<AdvertisementI>("Advertisement", AdvertisementSchema);
