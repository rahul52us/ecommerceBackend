import mongoose, { Document, Schema } from "mongoose";

interface IProduct extends Document {
  name: string;
  category: string;
  price: number;
  description?: string;
  images: string[];
  stock: number;
  brand?: string;
  sku?: string;
  weight?: string;
  productDetails: { [key: string]: any };
  createdAt?: Date;
  updatedAt?: Date;
}

const ProductSchema: Schema = new Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "company",
    required: true,
  },
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String, default: "" },
  images: [{ type: String }],
  stock: { type: Number, default: 0 },
  brand: { type: String, default: "" },
  sku: { type: String, default: "" },
  weight: { type: String, default: "" },
  productDetails: {
    type: Schema.Types.Mixed,
    default: {},
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: new Date(),
  },
  updatedAt: {
    type: Date,
  },
});

const Product = mongoose.model<IProduct>("Product", ProductSchema);

export default Product;