import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const BlogPostSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    excerpt: { type: String, default: "" },
    body: { type: String, default: "" },
    coverImage: { type: String },
    authorName: { type: String, default: "Luxen Editorial" },
    category: { type: String, default: "" },
    tags: { type: [String], default: [] },
    readTime: { type: Number },
    views: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

export type BlogPostDoc = InferSchemaType<typeof BlogPostSchema>;

export const BlogPost: Model<BlogPostDoc> =
  (mongoose.models.BlogPost as Model<BlogPostDoc>) ||
  mongoose.model<BlogPostDoc>("BlogPost", BlogPostSchema);
