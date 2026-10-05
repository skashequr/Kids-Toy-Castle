import { connectDB } from "../db/connect";
import { BlogPost } from "../models/BlogPost";
import { toBlogPost } from "../mappers";
import type { BlogPost as BlogPostType } from "@/types";

export async function getBlogPosts(limit?: number): Promise<BlogPostType[]> {
  await connectDB();
  let q = BlogPost.find({ isPublished: true }).sort({ publishedAt: -1 });
  if (limit) q = q.limit(limit);
  const docs = await q.lean();
  return docs.map(toBlogPost);
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPostType | null> {
  await connectDB();
  const doc = await BlogPost.findOne({ slug, isPublished: true }).lean();
  return doc ? toBlogPost(doc) : null;
}

/** All posts incl. drafts — for admin. */
export async function getAllBlogPostsAdmin() {
  await connectDB();
  const docs = await BlogPost.find({}).sort({ createdAt: -1 }).lean();
  return docs.map((d) => ({
    id: String(d._id),
    title: d.title,
    slug: d.slug,
    excerpt: d.excerpt ?? "",
    body: d.body ?? "",
    coverImage: d.coverImage ?? "",
    category: d.category ?? "",
    authorName: d.authorName ?? "Luxen Editorial",
    tags: d.tags ?? [],
    views: d.views ?? 0,
    isPublished: d.isPublished ?? false,
    createdAt: new Date(d.createdAt as Date).toISOString(),
  }));
}
