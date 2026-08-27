import mongoose, { Document, Schema } from 'mongoose';

export interface IGlobalConfig extends Document {
  paymentQrCode?: string;
  globalLogo?: string;
  cronTime?: string;
  tutorialDoc?: string;
}

const GlobalConfigSchema: Schema = new Schema(
  {
    paymentQrCode: {
      type: String,
      default: '',
    },
    globalLogo: {
      type: String,
      default: '',
    },
    cronTime: {
      type: String,
      default: '07:00', // Time string in HH:mm format (e.g., '07:00' for 7 AM)
    },
    tutorialDoc: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Ensure there is only one global config document
GlobalConfigSchema.pre('save', async function (next) {
  const count = await mongoose.model('GlobalConfig').countDocuments();
  if (count > 0 && this.isNew) {
    throw new Error('You can only create one global config document.');
  }
  next();
});

const GlobalConfig = mongoose.model<IGlobalConfig>('GlobalConfig', GlobalConfigSchema);
export default GlobalConfig;
