import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const FlashSaleSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    flashPrice: { type: Number, required: true },
    flashStock: { type: Number, default: 0 },
    soldCount: { type: Number, default: 0 },
    startsAt: { type: Date },
    saleEndsAt: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export type FlashSaleDoc = InferSchemaType<typeof FlashSaleSchema>;

export const FlashSale: Model<FlashSaleDoc> =
  (mongoose.models.FlashSale as Model<FlashSaleDoc>) ||
  mongoose.model<FlashSaleDoc>("FlashSale", FlashSaleSchema);
