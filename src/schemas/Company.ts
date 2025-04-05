import mongoose, { Schema, Document } from "mongoose";

interface IShop extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  logo: {
    name: string;
    url: string;
    type: string;
  };
  coverImage: {
    name: string;
    url: string;
    type: string;
  };
  categories: string[];
  tags: string[];
  about?:mongoose.Schema.Types.Mixed,
  ratings: { averageRating: number; totalRatings: number };
  location: {
    type: string;
    coordinates: [number, number];
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  multipleLocations?: {
    type: string;
    coordinates: [number, number];
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  }[];
  contactInfo: {
    phone: string;
    email?: string;
    website?: string;
    socialMedia?: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
      linkedin?: string;
      youtube?: string;
    };
  };
  gallery:any;
  operatingHours: mongoose.Schema.Types.Mixed,
  closedDates : any;
  shopStatus: "active" | "inactive" | "pending" | "suspended";
  isActive: boolean;
  createdAt: Date;
  updatedAt:Date;
}

const companySchema = new Schema<IShop>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    index: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  about : {
    type : mongoose.Schema.Types.Mixed
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
  coverImage: {
    name: {
      type: String,
    },
    url: {
      type: String,
    },
    type: {
      type: String,
    }
  },
  categories: [
    {
      type: String,
      index: true
    }
  ],
  tags: [
    {
      type: String,
      index: true
    }
  ],
  ratings: {
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalRatings: {
      type: Number,
      default: 0
    }
  },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point"
    },
    coordinates: {
      type: [Number],
      index: "2dsphere"
    },
    address: {
      type: String,
    },
    city: {
      type: String,
    },
    state: {
      type: String,
    },
    postalCode: {
      type: String,
    },
    country: {
      type: String,
    }
  },
  multipleLocations: [
    {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point"
      },
      coordinates: {
        type: [Number],
        index: "2dsphere"
      },
      address: {
        type: String
      },
      city: {
        type: String
      },
      state: {
        type: String
      },
      postalCode: {
        type: String
      },
      country: {
        type: String
      }
    }
  ],
  contactInfo: {
    phone: {
      type: String,
      match: [/^\+?[1-9]\d{1,14}$/, "Please enter a valid phone number"]
    },
    email: {
      type: String,
      match: [/\S+@\S+\.\S+/, "Please enter a valid email address"]
    },
    website: {
      type: String,
      match: [/https?:\/\/(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/, "Please enter a valid website URL"]
    },
    socialMedia: {
      facebook: {
        type: String
      },
      instagram: {
        type: String
      },
      twitter: {
        type: String
      },
      linkedin: {
        type: String
      },
      youtube: {
        type: String
      }
    }
  },
  operatingHours: {
    type: mongoose.Schema.Types.Mixed },
    closedDates : {
      type : Array,
      default : []
    },
  gallery : {
    type : mongoose.Schema.Types.Mixed,
    default : []
  },
  shopStatus: {
    type: String,
    enum: ["active", "inactive", "pending", "suspended"],
    default: "pending",
    index: true
  },
  isActive: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt : {
    type : Date
  }
});

companySchema.index({ name: 1, shopStatus: 1, createdAt: -1 });

const Company = mongoose.model<IShop>("Company", companySchema);
export default Company;
