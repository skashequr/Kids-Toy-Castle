import mongoose, { Schema } from "mongoose";

const contactSchema = new Schema({
  name: { type: String, default: "" },
  phone: { type: String, required: true, unique: true },
  active: { type: Boolean, default: true },
  consentAt: { type: Date, required: true },
}, { timestamps: true });
const campaignSchema = new Schema({
  channel: { type: String, enum: ["email", "whatsapp"], required: true },
  subject: { type: String, required: true },
  body: { type: String, default: "" },
  template: { type: String, default: "" },
  language: { type: String, default: "en_US" },
  parameters: [String],
  status: { type: String, default: "draft" },
  accepted: { type: Number, default: 0 },
  failed: { type: Number, default: 0 },
  results: [{ phone: String, messageId: String, error: String }],
}, { timestamps: true });
export const WhatsAppContact = mongoose.models.WhatsAppContact || mongoose.model("WhatsAppContact", contactSchema);
export const MarketingCampaign = mongoose.models.MarketingCampaign || mongoose.model("MarketingCampaign", campaignSchema);
