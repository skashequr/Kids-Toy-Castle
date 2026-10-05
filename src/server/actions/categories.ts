"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "../db/connect";
import { Category } from "../models/Category";
import { requireAdmin } from "../guard";
import { slugify } from "@/lib/utils";

export type CategoryInput = {
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  displayOrder?: number;
  isActive?: boolean;
};

function revalidate() {
  revalidatePath("/");
  revalidatePath("/admin/categories");
}

export async function createCategory(input: CategoryInput) {
  await requireAdmin();
  await connectDB();
  await Category.create({
    name: input.name,
    slug: input.slug?.trim() ? slugify(input.slug) : slugify(input.name),
    description: input.description,
    image: input.image,
    displayOrder: input.displayOrder ?? 0,
    isActive: input.isActive ?? true,
  });
  revalidate();
  return { ok: true };
}

export async function updateCategory(id: string, input: Partial<CategoryInput>) {
  await requireAdmin();
  await connectDB();
  const update: Record<string, unknown> = { ...input };
  if (input.slug) update.slug = slugify(input.slug);
  await Category.findByIdAndUpdate(id, update);
  revalidate();
  return { ok: true };
}

export async function deleteCategory(id: string) {
  await requireAdmin();
  await connectDB();
  await Category.findByIdAndDelete(id);
  revalidate();
  return { ok: true };
}
