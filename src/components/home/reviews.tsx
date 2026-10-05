import { Quote, Star } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Review } from "@/types";

export function Reviews({ reviews }: { reviews: Review[] }) {
  return (
    <section className="border-y border-[#d7c7a9]/45 bg-[#f6f1e7] py-16 sm:py-20 lg:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-11 max-w-2xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[.22em] text-[#ad7d2c]">Client notes</p>
          <h2 className="font-serif text-3xl font-semibold tracking-tight text-[#172b36] sm:text-4xl lg:text-5xl">Loved for the details.</h2>
          <div className="mt-5 flex items-center justify-center gap-2 text-sm text-[#53636b]"><span className="flex text-[#c89a43]">{[1, 2, 3, 4, 5].map((star) => <Star key={star} className="h-4 w-4 fill-current" />)}</span><strong className="ml-1 text-[#172b36]">4.8 / 5</strong><span>from 1,200+ reviews</span></div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {reviews.map((review) => (
            <article key={review.id} className="group flex min-h-72 flex-col rounded-2xl border border-[#d7c7a9]/60 bg-[#fffdf8] p-5 shadow-[0_10px_28px_rgba(28,42,47,.05)] transition duration-300 hover:-translate-y-1 hover:border-[#c89a43]/60 hover:shadow-[0_18px_38px_rgba(28,42,47,.1)] sm:p-6">
              <Quote className="mb-5 h-7 w-7 text-[#c89a43]" />
              <div className="mb-4 flex text-[#c89a43]">{Array.from({ length: 5 }).map((_, index) => <Star key={index} className={index < review.rating ? "h-3.5 w-3.5 fill-current" : "h-3.5 w-3.5 text-[#d7c7a9]"} />)}</div>
              {review.title && <h3 className="mb-2 text-sm font-semibold text-[#172b36]">{review.title}</h3>}
              <p className="line-clamp-4 text-sm leading-6 text-[#5b696e]">{review.body}</p>
              <div className="mt-auto flex items-center gap-3 border-t border-[#e9dfcb] pt-4"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#172b36] text-sm font-semibold text-[#f5e3b0]">{review.user.name.charAt(0).toUpperCase()}</span><div className="min-w-0"><p className="truncate text-sm font-semibold text-[#172b36]">{review.user.name}</p><p className="text-xs text-[#7a8789]">{formatDate(review.createdAt)}{review.isVerified ? " · Verified" : ""}</p></div></div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
