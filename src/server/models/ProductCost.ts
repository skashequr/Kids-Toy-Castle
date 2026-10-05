import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

// Private dated cost schedule; never included in storefront product responses.
const schema = new Schema({
  productId: { type: String, required: true },
  variantId: { type: String, default: "" },
  effectiveFrom: { type: String, required: true },
  unitCostCents: { type: Number, required: true, min: 0 },
  recordedBy: { type: String, required: true },
}, { timestamps: true });
schema.index({ productId: 1, variantId: 1, effectiveFrom: 1 }, { unique: true });
type CostDoc = InferSchemaType<typeof schema>;
export const ProductCost: Model<CostDoc> = (mongoose.models.ProductCost as Model<CostDoc>) || mongoose.model<CostDoc>("ProductCost", schema);
