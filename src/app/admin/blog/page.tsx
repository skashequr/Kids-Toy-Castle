import { AdminBlogClient, type AdminPostRow } from "@/components/admin/blog-client";
import { getAllBlogPostsAdmin } from "@/server/services/blog";

export const metadata = { title: "Blog | Luxen Admin" };

export default async function AdminBlogPage() {
  const posts = await getAllBlogPostsAdmin();
  const rows: AdminPostRow[] = posts.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    content: p.body,
    category: p.category,
    image: p.coverImage,
    author: p.authorName,
    status: p.isPublished ? "published" : "draft",
    views: p.views,
    tags: (p.tags ?? []).join(", "),
    createdAt: p.createdAt,
  }));
  return <AdminBlogClient initial={rows} />;
}
