import { connectDB } from "../db/connect";
import { Category } from "../models/Category";
import { Product } from "../models/Product";
import { toCategory } from "../mappers";
import type { Category as CategoryType } from "@/types";

export async function getCategories(): Promise<CategoryType[]> {
  await connectDB();
  const docs = await Category.find({ isActive: true })
    .sort({ displayOrder: 1, name: 1 })
    .lean();
  return docs.map(toCategory);
}

/** Categories with live product counts — used by the storefront grid. */
export async function getCategoriesWithCounts(): Promise<CategoryType[]> {
  await connectDB();
  const docs = await Category.find({ isActive: true })
    .sort({ displayOrder: 1, name: 1 })
    .lean();
  const counts = await Product.aggregate<{ _id: unknown; count: number }>([
    { $match: { isActive: true } },
    { $group: { _id: "$category", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));
  return docs.map((d) => ({
    ...toCategory(d),
    productCount: countMap.get(String(d._id)) ?? 0,
  }));
}

/** All categories incl. inactive — for admin. */
export async function getAllCategoriesAdmin(): Promise<CategoryType[]> {
  await connectDB();
  const docs = await Category.find({}).sort({ displayOrder: 1, name: 1 }).lean();
  return docs.map(toCategory);
}

export async function getCategoryBySlug(slug: string): Promise<CategoryType | null> {
  await connectDB();
  const doc = await Category.findOne({ slug }).lean();
  return doc ? toCategory(doc) : null;
}
