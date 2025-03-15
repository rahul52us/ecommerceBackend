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
  operatingHours: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };
  shopStatus: "active" | "inactive" | "pending" | "suspended";
  isActive: boolean;
  createdAt: Date;
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
    required: true,
    trim: true
  },
  logo: {
    name: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true
    }
  },
  coverImage: {
    name: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true
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
      required: true,
      index: "2dsphere"
    },
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    postalCode: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true
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
        required: true,
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
      required: true,
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
    monday: { type: String },
    tuesday: { type: String },
    wednesday: { type: String },
    thursday: { type: String },
    friday: { type: String },
    saturday: { type: String },
    sunday: { type: String }
  },
  shopStatus: {
    type: String,
    enum: ["active", "inactive", "pending", "suspended"],
    default: "pending",
    index: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

companySchema.index({ name: 1, shopStatus: 1, createdAt: -1 });

const Company = mongoose.model<IShop>("Company", companySchema);
export default Company;
