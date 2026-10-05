import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Clock, ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getBlogPostBySlug } from "@/server/services/blog";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();

  return (
    <>
      <Header />
      <main>
        <article className="container mx-auto px-4 py-12 max-w-3xl">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-gold hover:text-gold-dark mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> All Posts
          </Link>

          <span className="text-xs font-semibold bg-gold/10 text-gold px-2 py-1 rounded-full">
            {post.category}
          </span>
          <h1 className="font-serif text-3xl lg:text-4xl font-bold mt-4 mb-3">{post.title}</h1>
          <div className="flex items-center gap-3 text-sm text-muted mb-8">
            <span>{post.author.name}</span>
            <span>·</span>
            <span>{formatDate(post.publishedAt)}</span>
            {post.readTime && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {post.readTime} min read
                </span>
              </>
            )}
          </div>

          {post.coverImage && (
            <div className="relative aspect-[16/9] rounded-2xl overflow-hidden mb-8 bg-ivory-dark dark:bg-navy-light">
              <Image src={post.coverImage} alt={post.title} fill className="object-cover" />
            </div>
          )}

          <p className="text-lg text-muted leading-relaxed mb-6">{post.excerpt}</p>
          {post.body && (
            <div className="prose dark:prose-invert max-w-none whitespace-pre-line leading-relaxed">
              {post.body}
            </div>
          )}
        </article>
      </main>
      <Footer />
    </>
  );
}
