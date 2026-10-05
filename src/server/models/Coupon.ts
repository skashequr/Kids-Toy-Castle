import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const CouponSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    // percentage | fixed
    type: { type: String, required: true, default: "percentage" },
    value: { type: Number, required: true },
    minPurchase: { type: Number },
    maxDiscount: { type: Number },
    usageLimit: { type: Number },
    usedCount: { type: Number, default: 0 },
    description: { type: String },
    expiresAt: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export type CouponDoc = InferSchemaType<typeof CouponSchema>;

export const Coupon: Model<CouponDoc> =
  (mongoose.models.Coupon as Model<CouponDoc>) ||
  mongoose.model<CouponDoc>("Coupon", CouponSchema);
