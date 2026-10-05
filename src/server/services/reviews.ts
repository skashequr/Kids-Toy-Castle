import { connectDB } from "../db/connect";
import { Review } from "../models/Review";
import { toReview } from "../mappers";
import type { Review as ReviewType } from "@/types";

/** Approved reviews for the homepage social-proof section. */
export async function getApprovedReviews(limit = 4): Promise<ReviewType[]> {
  await connectDB();
  const docs = await Review.find({ status: "approved" })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return docs.map(toReview);
}

export async function getReviewsForProduct(productId: string): Promise<ReviewType[]> {
  await connectDB();
  const docs = await Review.find({ product: productId, status: "approved" })
    .sort({ createdAt: -1 })
    .lean();
  return docs.map(toReview);
}

/** Raw review rows for the admin moderation screen (any status). */
export async function getAllReviewsAdmin() {
  await connectDB();
  const docs = await Review.find({}).sort({ createdAt: -1 }).lean();
  return docs.map((d) => ({
    id: String(d._id),
    productName: d.productName ?? "",
    userName: d.userName,
    rating: d.rating,
    title: d.title ?? "",
    body: d.body,
    status: d.status ?? "pending",
    createdAt: new Date(d.createdAt as Date).toISOString(),
  }));
}
