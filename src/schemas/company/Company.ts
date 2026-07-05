import mongoose, { Document } from "mongoose";

interface addressInfo {
  address?: string;
  country?: string;
  state?: string;
  city?: string;
  pinCode?: string
}

export interface CompanyI extends Document {
  company_name: string;
  companyCode: string;
  companyOrg: mongoose.Schema.Types.ObjectId,
  companyType: string;
  verified_email_allowed: boolean;
  createdBy: mongoose.Schema.Types.ObjectId;
  activeUser: mongoose.Schema.Types.ObjectId;
  is_active?: boolean;
  logo?: { name?: string; url?: string; type?: string; };
  bio?: string;
  mobileNo?: string;
  workNo?: string;
  facebookLink?: string;
  instagramLink?: string;
  linkedInLink?: string;
  twitterLink?: string;
  githubLink?: string;
  telegramLink?: string;
  otherLinks?: string[];
  webLink?: string;
  address1?: string;
  address2?: string;
  pinCode?: string;
  country?: string;
  state?: string;
  city?: string;
  deletedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  addressInfo?: addressInfo[];
  operatingHours?: any[]
  sidebarColors?: any;
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;
  subscriptionHistory?: {
    startDate: Date;
    endDate: Date;
    amount?: number;
    description?: string;
    updatedAt: Date;
    updatedBy: mongoose.Schema.Types.ObjectId;
  }[];
}

const companySchema = new mongoose.Schema<CompanyI>({
  company_name: {
    type: String,
    unique: true,
    index: true,
    trim: true,
  },
  companyOrg: {
    type: mongoose.Schema.Types.ObjectId,
  },
  companyCode: {
    type: String,
    required: true
  },
  companyType: {
    type: String,
    default: 'company'
  },
  is_active: {
    type: Boolean,
    default: false
  },
  verified_email_allowed: {
    type: Boolean,
    default: false,
  },
  logo: {
    name: {
      type: String
    },
    url: {
      type: String
    },
    type: {
      type: String
    }
  },
  bio: {
    type: String,
  },
  mobileNo: {
    type: String,
  },
  workNo: {
    type: String,
  },
  facebookLink: {
    type: String,
  },
  instagramLink: {
    type: String,
  },
  twitterLink: {
    type: String,
  },
  githubLink: {
    type: String,
  },
  telegramLink: {
    type: String,
  },
  linkedInLink: {
    type: String,
  },
  otherLinks: {
    type: [{ type: String }],
  },
  addressInfo: {
    type: [{
      address: String,
      country: String,
      state: String,
      city: String,
      pinCode: String
    }]
  },
  operatingHours: { type: Array, default: [] },
  sidebarColors: { type: mongoose.Schema.Types.Mixed, default: {} },
  activeUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deletedAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: new Date(),
  },
  updatedAt: {
    type: Date,
  },
  subscriptionStartDate: {
    type: Date,
  },
  subscriptionEndDate: {
    type: Date,
  },
  subscriptionHistory: {
    type: [{
      startDate: Date,
      endDate: Date,
      amount: Number,
      description: String,
      updatedAt: { type: Date, default: Date.now },
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }],
    default: []
  },
});

export default mongoose.model<CompanyI>("Company", companySchema);
