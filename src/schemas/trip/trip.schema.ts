import mongoose, { Schema, Document } from "mongoose";

interface TravelDetails {
  country?: string;
  fromState?:string;
  toState?:string;
  fromCity?: string;
  toCity?: string;
  startDate?: Date;
  endDate?: Date;
  travelMode?: string;
  travelCost?: string;
  isCab?: boolean;
  cabCost?: string;
  isAccommodation?: boolean;
  locality?: string;
  durationOfStay?: number;
  accommodationCost?: string;
}

interface AdditionalExpense {
  type: string;
  amount: string;
}

interface Trip extends Document {
  title: string;
  description: string;
  thumbnail?: string;
  isActive?: boolean;
  country?:string;
  currency?:string;
  type: string;
  status: string;
  createdBy: mongoose.Schema.Types.ObjectId;
  company: mongoose.Schema.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
  participants?: mongoose.Schema.Types.ObjectId[];
  travelDetails?: TravelDetails[];
  additionalExpenses?: AdditionalExpense[];
}

const TravelDetailsSchema = new Schema<TravelDetails>({
  fromState:{type : String},
  toState:{type : String},
  fromCity: { type: String },
  toCity: { type: String},
  startDate: { type: Date },
  endDate: { type: Date },
  travelMode: { type: String },
  travelCost: { type: String },
  isCab: { type: Boolean },
  cabCost: { type: String },
  isAccommodation: { type: Boolean },
  locality: { type: String },
  durationOfStay: { type: Number },
  accommodationCost: { type: String },
});

const AdditionalExpenseSchema = new Schema<AdditionalExpense>({
  type: { type: String, required: true },
  amount: { type: String, required: true },
});

const TripSchema = new Schema<Trip>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  thumbnail: { type: String },
  currency:{type : String, default : 'RS'},
  country:{type : String},
  type: {
    type: String,
    enum: ["individual", "group"],
    default: "individual",
  },
  isActive: { type: Boolean, default: true },
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
  createdAt: { type: Date, default: new Date() },
  updatedAt: { type: Date },
  deletedAt: { type: Date, default: null },
  participants: { type: [mongoose.Schema.Types.ObjectId] },
  travelDetails: { type: [TravelDetailsSchema] },
  additionalExpenses: { type: [AdditionalExpenseSchema] },
});

const TripModel = mongoose.model<Trip>("Trip", TripSchema);
export { Trip, TripModel };