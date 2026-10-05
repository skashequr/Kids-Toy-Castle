import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { BlogPost } from "@/types";

export function BlogPreview({ posts }: { posts: BlogPost[] }) {
  return (
    <section className="py-16 lg:py-24 bg-ivory-dark dark:bg-navy-light/30">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-3 mb-3">
              <div className="h-px w-10 bg-gold" />
              <span className="text-gold text-xs font-semibold tracking-[0.2em] uppercase">Luxen Journal</span>
            </div>
            <h2 className="font-serif text-2xl lg:text-3xl font-bold">Style & Lifestyle Blog</h2>
          </div>
          <Link
            href="/blog"
            className="flex-shrink-0 inline-flex items-center gap-1.5 text-sm font-medium text-gold hover:text-gold-dark border-b border-gold/40 hover:border-gold pb-0.5 transition-colors"
          >
            All Posts <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group rounded-2xl overflow-hidden bg-ivory dark:bg-navy card-hover border border-navy/5 dark:border-ivory/5"
            >
              {/* Image */}
              <div className="relative aspect-[16/9] bg-navy/10 dark:bg-ivory/5 overflow-hidden">
                {post.coverImage ? (
                  <Image src={post.coverImage} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-5xl opacity-20">📝</div>
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <span className="text-xs font-semibold bg-navy/80 text-ivory px-3 py-1 rounded-full">
                    {post.category}
                  </span>
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-center gap-3 text-muted text-xs mb-3">
                  <span>{formatDate(post.publishedAt)}</span>
                  {post.readTime && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {post.readTime} min read
                      </span>
                    </>
                  )}
                </div>
                <h3 className="font-serif font-bold text-base mb-2 line-clamp-2 group-hover:text-gold transition-colors">
                  {post.title}
                </h3>
                <p className="text-sm text-muted line-clamp-2">{post.excerpt}</p>
                <div className="flex items-center gap-1.5 mt-4 text-gold text-xs font-semibold">
                  Read More <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
