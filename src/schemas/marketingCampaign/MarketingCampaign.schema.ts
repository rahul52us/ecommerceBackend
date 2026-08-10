import mongoose from 'mongoose';

const MarketingCampaignSchema = new mongoose.Schema(
  {
    templateName: {
      type: String,
      required: true,
    },
    scheduledDates: {
      type: [Date],
      required: true,
    },
    audience: {
      type: [String],
      default: ['patient']
    },
    company: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company'
    }]
  },
  { timestamps: true }
);

export default mongoose.model('MarketingCampaign', MarketingCampaignSchema);
