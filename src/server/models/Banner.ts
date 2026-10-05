import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const BannerSchema = new Schema(
  {
    title: { type: String, required: true },
    subtitle: { type: String },
    image: { type: String, required: true },
    link: { type: String },
    position: {
      type: String,
      enum: ["hero", "homepage-mid", "category", "sidebar", "popup"],
      default: "hero",
    },
    isActive: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export type BannerDoc = InferSchemaType<typeof BannerSchema>;

export const Banner: Model<BannerDoc> =
  (mongoose.models.Banner as Model<BannerDoc>) ||
  mongoose.model<BannerDoc>("Banner", BannerSchema);
