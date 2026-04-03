import mongoose, { Document, Schema } from "mongoose";

const DealerItemSchema = new Schema<any>({
  dealer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Dealer",
    required: true,
    index: true,
  },
  brandName: {
    type: String,
  },
  itemName: {
    type: String,
    required: true,
    index: true,
  },
  itemCode: {
    type: String,
  },
  quantity: {
    type: Number,
    default: 0,
  },
  price: {
    type: Number,
  },
  total: {
    type: Number,
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
  createdAt: {
    type: Date,
    default: new Date(),
  },
  deletedAt: {
    type : Date
  }
});

const DealerItemModal = mongoose.model<any>("DealerItem", DealerItemSchema);
export default DealerItemModal;
