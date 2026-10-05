import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const ContactMessageSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String, default: "" },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export type ContactMessageDoc = InferSchemaType<typeof ContactMessageSchema>;

export const ContactMessage: Model<ContactMessageDoc> =
  (mongoose.models.ContactMessage as Model<ContactMessageDoc>) ||
  mongoose.model<ContactMessageDoc>("ContactMessage", ContactMessageSchema);
