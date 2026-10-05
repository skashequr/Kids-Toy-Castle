"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "../db/connect";
import { Review } from "../models/Review";
import { Product } from "../models/Product";
import { requireAdmin } from "../guard";

export type ReviewInput = {
  productId: string;
  productName?: string;
  userName: string;
  userEmail?: string;
  rating: number;
  title?: string;
  body: string;
};

export async function submitReview(
  input: ReviewInput
): Promise<{ ok: boolean; error?: string }> {
  await connectDB();
  if (!input.userName?.trim() || !input.body?.trim()) {
    return { ok: false, error: "Name and review text are required." };
  }
  if (input.rating < 1 || input.rating > 5) {
    return { ok: false, error: "Please select a rating." };
  }
  await Review.create({
    product: input.productId,
    productName: input.productName ?? "",
    userName: input.userName,
    userEmail: input.userEmail,
    rating: input.rating,
    title: input.title,
    body: input.body,
    status: "pending",
  });
  revalidatePath("/admin/reviews");
  return { ok: true };
}

export async function updateReviewStatus(id: string, status: string) {
  await requireAdmin();
  await connectDB();
  const review = await Review.findByIdAndUpdate(id, { status }, { new: true });

  // Recompute the product's aggregate rating from approved reviews.
  if (review?.product) {
    const approved = await Review.find({
      product: review.product,
      status: "approved",
    }).lean();
    const count = approved.length;
    const avg =
      count > 0 ? approved.reduce((s, r) => s + (r.rating ?? 0), 0) / count : 0;
    await Product.findByIdAndUpdate(review.product, {
      rating: Math.round(avg * 10) / 10,
      reviewCount: count,
    });
  }

  revalidatePath("/admin/reviews");
  return { ok: true };
}
