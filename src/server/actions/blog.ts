"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "../db/connect";
import { BlogPost } from "../models/BlogPost";
import { requireAdmin } from "../guard";
import { slugify } from "@/lib/utils";

export type BlogInput = {
  title: string;
  slug?: string;
  excerpt?: string;
  body?: string;
  coverImage?: string;
  authorName?: string;
  category?: string;
  tags?: string[];
  readTime?: number;
  isPublished?: boolean;
};

function revalidate() {
  revalidatePath("/blog");
  revalidatePath("/");
  revalidatePath("/admin/blog");
}

export async function createBlogPost(input: BlogInput) {
  await requireAdmin();
  await connectDB();
  await BlogPost.create({
    title: input.title,
    slug: input.slug?.trim() ? slugify(input.slug) : slugify(input.title),
    excerpt: input.excerpt ?? "",
    body: input.body ?? "",
    coverImage: input.coverImage,
    authorName: input.authorName ?? "Luxen Editorial",
    category: input.category ?? "",
    tags: input.tags ?? [],
    readTime: input.readTime,
    isPublished: input.isPublished ?? false,
    publishedAt: input.isPublished ? new Date() : undefined,
  });
  revalidate();
  return { ok: true };
}

export async function updateBlogPost(id: string, input: Partial<BlogInput>) {
  await requireAdmin();
  await connectDB();
  const update: Record<string, unknown> = { ...input };
  if (input.slug) update.slug = slugify(input.slug);
  if (input.isPublished) update.publishedAt = new Date();
  await BlogPost.findByIdAndUpdate(id, update);
  revalidate();
  return { ok: true };
}

export async function deleteBlogPost(id: string) {
  await requireAdmin();
  await connectDB();
  await BlogPost.findByIdAndDelete(id);
  revalidate();
  return { ok: true };
}
