import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const ProductImageSchema = new Schema(
  {
    url: { type: String, required: true },
    alt: { type: String, default: "" },
    isPrimary: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { _id: true }
);

const ProductVariantSchema = new Schema(
  {
    image: { type: String },
    name: { type: String },
    color: { type: String },
    colorHex: { type: String },
    size: { type: String },
    stock: { type: Number, default: 0 },
    sku: { type: String, required: true },
    price: { type: Number },
  },
  { _id: true }
);

const ProductSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: "" },
    highlights: { type: [String], default: [] },
    price: { type: Number, required: true },
    comparePrice: { type: Number },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    images: { type: [ProductImageSchema], default: [] },
    variants: { type: [ProductVariantSchema], default: [] },
    tags: { type: [String], default: [] },
    sku: { type: String, required: true },
    stock: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    // Stored as `isNewArrival` because `isNew` is a reserved Mongoose path.
    isNewArrival: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    isOnSale: { type: Boolean, default: false },
    saleEndsAt: { type: Date },
    // Free-form key/value specs. Stored as a plain object.
    specifications: { type: Schema.Types.Mixed, default: {} },
    brand: { type: String },
    weight: { type: String },
    dimensions: { type: String },
    material: { type: String },
    isActive: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export type ProductDoc = InferSchemaType<typeof ProductSchema>;

export const Product: Model<ProductDoc> =
  (mongoose.models.Product as Model<ProductDoc>) ||
  mongoose.model<ProductDoc>("Product", ProductSchema);
