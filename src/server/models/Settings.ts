import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * Singleton document holding all store settings. We always read/write the
 * single document identified by `key: "default"`.
 */
const SettingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "default" },
    store: { type: Schema.Types.Mixed, default: {} },
    shipping: { type: Schema.Types.Mixed, default: {} },
    payment: { type: Schema.Types.Mixed, default: {} },
    notifications: { type: Schema.Types.Mixed, default: {} },
    seo: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export type SettingsDoc = InferSchemaType<typeof SettingsSchema>;

export const Settings: Model<SettingsDoc> =
  (mongoose.models.Settings as Model<SettingsDoc>) ||
  mongoose.model<SettingsDoc>("Settings", SettingsSchema);
