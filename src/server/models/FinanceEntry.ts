import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const schema = new Schema({
  requestId: { type: String, required: true, unique: true },
  date: { type: String, required: true, index: true },
  type: { type: String, enum: ["income", "expense"], required: true },
  category: { type: String, required: true },
  amountCents: { type: Number, required: true, min: 1 },
  description: { type: String, required: true },
  reference: { type: String, default: "" },
  productId: { type: String, default: "" },
  createdBy: { type: String, required: true },
  voided: { type: Boolean, default: false },
  voidReason: { type: String, default: "" },
  voidedBy: String,
  voidedAt: Date,
}, { timestamps: true });

type EntryDoc = InferSchemaType<typeof schema>;
export const FinanceEntry: Model<EntryDoc> = (mongoose.models.FinanceEntry as Model<EntryDoc>) || mongoose.model<EntryDoc>("FinanceEntry", schema);
