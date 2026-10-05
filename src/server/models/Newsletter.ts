import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const NewsletterSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    name: { type: String },
    isActive: { type: Boolean, default: true },
    subscribedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export type NewsletterDoc = InferSchemaType<typeof NewsletterSchema>;

export const Newsletter: Model<NewsletterDoc> =
  (mongoose.models.Newsletter as Model<NewsletterDoc>) ||
  mongoose.model<NewsletterDoc>("Newsletter", NewsletterSchema);
