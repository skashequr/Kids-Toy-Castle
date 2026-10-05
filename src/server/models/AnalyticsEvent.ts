import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const AnalyticsEventSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["page_view", "product_view", "add_to_cart", "checkout_started"],
      required: true,
      index: true,
    },
    // Random browser-local identifier only. No customer name, email, phone, IP,
    // or other personal information is collected for this dashboard.
    sessionId: { type: String, required: true, index: true },
    path: { type: String, default: "/" },
    productId: { type: String },
    productName: { type: String },
  },
  { timestamps: true }
);

AnalyticsEventSchema.index({ createdAt: -1, type: 1 });

export type AnalyticsEventDoc = InferSchemaType<typeof AnalyticsEventSchema>;

export const AnalyticsEvent: Model<AnalyticsEventDoc> =
  (mongoose.models.AnalyticsEvent as Model<AnalyticsEventDoc>) ||
  mongoose.model<AnalyticsEventDoc>("AnalyticsEvent", AnalyticsEventSchema);
