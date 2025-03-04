import mongoose, { Schema, Document } from 'mongoose';

const ProductDetailsSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  specifications: { type: Schema.Types.Mixed },
});
const ProductDetails = mongoose.model<Document>('ProductDetails', ProductDetailsSchema);
export default ProductDetails;
