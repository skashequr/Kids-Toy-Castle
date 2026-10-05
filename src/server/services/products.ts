import { connectDB } from "../db/connect";
import { Product } from "../models/Product";
import { Category } from "../models/Category";
import { toProduct } from "../mappers";
import type { Product as ProductType } from "@/types";

type ProductQuery = {
  isNew?: boolean;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isOnSale?: boolean;
  limit?: number;
};

export async function getProducts(filter: ProductQuery = {}): Promise<ProductType[]> {
  await connectDB();
  const query: Record<string, unknown> = { isActive: true };
  if (filter.isNew) query.isNewArrival = true;
  if (filter.isFeatured) query.isFeatured = true;
  if (filter.isBestSeller) query.isBestSeller = true;
  if (filter.isOnSale) query.isOnSale = true;

  let q = Product.find(query).populate("category").sort({ displayOrder: 1, createdAt: -1 });
  if (filter.limit) q = q.limit(filter.limit);
  const docs = await q.lean();
  return docs.map(toProduct);
}

/** All products including inactive — for the admin product list. */
export async function getAllProductsAdmin(): Promise<ProductType[]> {
  await connectDB();
  const docs = await Product.find({}).populate("category").sort({ displayOrder: 1, createdAt: -1 }).lean();
  return docs.map(toProduct);
}

export async function getProductBySlug(slug: string): Promise<ProductType | null> {
  await connectDB();
  const doc = await Product.findOne({ slug }).populate("category").lean();
  return doc ? toProduct(doc) : null;
}

export async function getProductById(id: string): Promise<ProductType | null> {
  await connectDB();
  const doc = await Product.findById(id).populate("category").lean();
  return doc ? toProduct(doc) : null;
}

export async function getProductsByCategorySlug(slug: string): Promise<ProductType[]> {
  await connectDB();
  const docs = await Product.find({ isActive: true })
    .populate({ path: "category", match: { slug } })
    .sort({ displayOrder: 1, createdAt: -1 })
    .lean();
  // populate match leaves category null when it doesn't match; keep only matches
  return docs.filter((d) => d.category).map(toProduct);
}

/** Products across several categories — used by nav "group" landing pages. */
export async function getProductsByCategorySlugs(slugs: string[]): Promise<ProductType[]> {
  await connectDB();
  const categories = await Category.find({ slug: { $in: slugs } }).select("_id").lean();
  const ids = categories.map((c) => c._id);
  if (ids.length === 0) return [];
  const docs = await Product.find({ isActive: true, category: { $in: ids } })
    .populate("category")
    .sort({ displayOrder: 1, createdAt: -1 })
    .lean();
  return docs.map(toProduct);
}

export async function getRelatedProducts(
  productId: string,
  categoryId: string,
  limit = 4
): Promise<ProductType[]> {
  await connectDB();
  const docs = await Product.find({
    isActive: true,
    category: categoryId,
    _id: { $ne: productId },
  })
    .populate("category")
    .sort({ displayOrder: 1, createdAt: -1 })
    .limit(limit)
    .lean();
  return docs.map(toProduct);
}
