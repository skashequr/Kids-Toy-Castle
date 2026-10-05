"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "../db/connect";
import { Product } from "../models/Product";
import { requireAdmin } from "../guard";
import { slugify } from "@/lib/utils";

export type ProductInput = {
  name: string;
  slug?: string;
  description?: string;
  highlights?: string[];
  price: number;
  comparePrice?: number;
  categoryId: string;
  images?: { url: string; alt?: string; isPrimary?: boolean }[];
  variants?: {
    _id?: string;
    image?: string;
    name?: string;
    color?: string;
    colorHex?: string;
    size?: string;
    stock?: number;
    sku: string;
    price?: number;
  }[];
  specifications?: Record<string, string>;
  tags?: string[];
  sku: string;
  stock?: number;
  brand?: string;
  weight?: string;
  material?: string;
  dimensions?: string;
  isNew?: boolean;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isOnSale?: boolean;
};

function revalidateStorefront() {
  revalidatePath("/");
  revalidatePath("/admin/products");
  revalidatePath("/new-arrivals");
  revalidatePath("/best-sellers");
}

export async function createProduct(input: ProductInput) {
  await requireAdmin();
  await connectDB();
  const slug = input.slug?.trim() ? slugify(input.slug) : slugify(input.name);
  // New products go to the end of the saved storefront order. They should not
  // disturb an order an admin has already arranged.
  const lastProduct = await Product.findOne({})
    .sort({ displayOrder: -1, createdAt: -1 })
    .select("displayOrder")
    .lean();
  const displayOrder = (lastProduct?.displayOrder ?? -1) + 1;
  await Product.create({
    name: input.name,
    slug,
    description: input.description ?? "",
    highlights: input.highlights ?? [],
    price: input.price,
    comparePrice: input.comparePrice,
    category: input.categoryId,
    images: (input.images ?? []).map((img, i) => ({
      url: img.url,
      alt: img.alt ?? "",
      isPrimary: img.isPrimary ?? i === 0,
      order: i,
    })),
    variants: input.variants ?? [],
    specifications: input.specifications ?? {},
    tags: input.tags ?? [],
    sku: input.sku,
    stock: input.variants?.length ? input.variants.reduce((sum, v) => sum + (v.stock ?? 0), 0) : input.stock ?? 0,
    brand: input.brand,
    weight: input.weight,
    material: input.material,
    dimensions: input.dimensions,
    isNewArrival: input.isNew ?? false,
    isFeatured: input.isFeatured ?? false,
    isBestSeller: input.isBestSeller ?? false,
    isOnSale: input.isOnSale ?? false,
    isActive: true,
    displayOrder,
  });
  revalidateStorefront();
  return { ok: true };
}

export async function updateProduct(id: string, input: ProductInput) {
  await requireAdmin();
  await connectDB();
  const slug = input.slug?.trim() ? slugify(input.slug) : slugify(input.name);
  await Product.findByIdAndUpdate(id, {
    name: input.name,
    slug,
    description: input.description ?? "",
    highlights: input.highlights ?? [],
    price: input.price,
    comparePrice: input.comparePrice,
    category: input.categoryId,
    images: (input.images ?? []).map((img, i) => ({
      url: img.url,
      alt: img.alt ?? "",
      isPrimary: img.isPrimary ?? i === 0,
      order: i,
    })),
    variants: input.variants ?? [],
    specifications: input.specifications ?? {},
    tags: input.tags ?? [],
    sku: input.sku,
    stock: input.variants?.length ? input.variants.reduce((sum, v) => sum + (v.stock ?? 0), 0) : input.stock ?? 0,
    brand: input.brand,
    weight: input.weight,
    material: input.material,
    dimensions: input.dimensions,
    isNewArrival: input.isNew ?? false,
    isFeatured: input.isFeatured ?? false,
    isBestSeller: input.isBestSeller ?? false,
    isOnSale: input.isOnSale ?? false,
  });
  revalidateStorefront();
  revalidatePath(`/product/${slug}`);
  return { ok: true };
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  await connectDB();
  await Product.findByIdAndDelete(id);
  revalidateStorefront();
  return { ok: true };
}

export async function reorderProducts(
  productIds: string[]
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  await connectDB();

  try {
    if (!productIds.length || new Set(productIds).size !== productIds.length) {
      return { ok: false, error: "The product order is invalid." };
    }

    // Reordering is only valid when it covers the complete admin list. This
    // prevents a filtered list from accidentally overwriting the global order.
    const storedProducts = await Product.find({}).select("_id").lean();
    const storedIds = new Set(storedProducts.map((product) => String(product._id)));
    if (
      productIds.length !== storedIds.size ||
      productIds.some((productId) => !storedIds.has(productId))
    ) {
      return { ok: false, error: "Products changed. Refresh and try again." };
    }

    await Product.bulkWrite(
      productIds.map((id, displayOrder) => ({
        updateOne: { filter: { _id: id }, update: { $set: { displayOrder } } },
      })),
      { ordered: true },
    );

    revalidateStorefront();
    return { ok: true };
  } catch (error) {
    console.error("Reorder error:", error);
    return { ok: false, error: "Failed to reorder products" };
  }
}
