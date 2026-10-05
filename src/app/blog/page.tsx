import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import Link from "next/link";
import { Clock, ArrowRight } from "lucide-react";
import { getBlogPosts } from "@/server/services/blog";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Blog" };
export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const posts = await getBlogPosts();
  return (
    <>
      <Header />
      <main>
        <div className="bg-navy py-16 px-4 text-center">
          <p className="text-gold text-sm font-medium tracking-[0.2em] uppercase mb-3">Luxen Journal</p>
          <h1 className="font-serif text-4xl font-bold text-ivory">Style & Lifestyle Blog</h1>
        </div>

        <section className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group rounded-2xl overflow-hidden bg-ivory-dark dark:bg-navy-light card-hover">
                <div className="aspect-[16/9] bg-navy/10 dark:bg-ivory/5 flex items-center justify-center">
                  <span className="text-5xl opacity-30">📝</span>
                </div>
                <div className="p-6">
                  <span className="text-xs font-semibold bg-gold/10 text-gold px-2 py-1 rounded-full">{post.category}</span>
                  <h2 className="font-serif font-bold text-lg mt-3 mb-2 group-hover:text-gold transition-colors">{post.title}</h2>
                  <p className="text-muted text-sm line-clamp-2 mb-4">{post.excerpt}</p>
                  <div className="flex items-center justify-between text-xs text-muted">
                    <span>{formatDate(post.publishedAt)}</span>
                    {post.readTime && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {post.readTime} min
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-3 text-gold text-xs font-semibold">
                    Read Article <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
