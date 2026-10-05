import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Package, Sparkles } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import type { Category } from "@/types";

const CARD_TONES = [
  { surface: "from-[#dff3ff] to-[#eef9ff]", accent: "bg-[#248fd6]", text: "text-[#176799]" },
  { surface: "from-[#ffe4ef] to-[#fff2f7]", accent: "bg-[#f06a9f]", text: "text-[#a72e62]" },
  { surface: "from-[#fff0bd] to-[#fff9df]", accent: "bg-[#f3b82e]", text: "text-[#875a00]" },
  { surface: "from-[#e4f6eb] to-[#f0fbf4]", accent: "bg-[#65b96b]", text: "text-[#2c773d]" },
  { surface: "from-[#eee7ff] to-[#f7f3ff]", accent: "bg-[#8968c3]", text: "text-[#66459e]" },
];

function categoryImage(category: Category) {
  if (!category.image || category.image.endsWith("/default.jpg")) return null;
  return category.image;
}

export function CategoriesGrid({ categories }: { categories: Category[] }) {
  if (!categories.length) return null;

  return (
    <section className="bg-[#f6fbff] py-11 sm:py-14" aria-labelledby="categories-title">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mb-7 flex flex-col gap-3 sm:mb-9 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-[#e8548b]">
                <Sparkles className="h-3.5 w-3.5" /> পছন্দের জগৎ
              </p>
              <h2 id="categories-title" className="mt-2 font-serif text-3xl font-bold text-[#1b588b] sm:text-4xl">
                ক্যাটাগরি থেকে খেলনা খুঁজুন
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6b8497]">
                বয়স, আগ্রহ আর খেলার ধরন অনুযায়ী সাজানো সব collection এক জায়গায়।
              </p>
            </div>
            <p className="w-fit rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#248fd6] shadow-sm ring-1 ring-[#d8edf9]">
              {categories.length}টি ক্যাটাগরি
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {categories.map((category, index) => {
            const tone = CARD_TONES[index % CARD_TONES.length];
            const image = categoryImage(category);
            const count = category.productCount ?? 0;

            return (
              <Reveal key={category.id} delay={(index % 5) * 0.05} className="h-full">
                <Link
                  href={`/category/${category.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-3xl border border-white bg-white shadow-[0_8px_22px_rgba(46,128,179,.08)] transition duration-300 hover:-translate-y-1 hover:border-[#b9ddf2] hover:shadow-[0_16px_32px_rgba(46,128,179,.15)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#248fd6]/20"
                >
                  <div className={`relative aspect-[4/3] overflow-hidden bg-gradient-to-br ${tone.surface}`}>
                    {image ? (
                      <Image
                        src={image}
                        alt={category.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className={`absolute inset-0 grid place-items-center ${tone.text}`}>
                        <span className="grid h-16 w-16 place-items-center rounded-3xl bg-white/75 shadow-sm ring-1 ring-white">
                          <Package className="h-8 w-8" />
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#174c70]/45 via-transparent to-transparent opacity-70" />
                    <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-[#315a77] shadow-sm backdrop-blur-sm">
                      {count} {count === 1 ? "toy" : "toys"}
                    </span>
                  </div>

                  <div className="flex flex-1 items-center justify-between gap-2 p-3.5 sm:p-4">
                    <h3 className="line-clamp-2 text-sm font-bold leading-5 text-[#234963] sm:text-base">
                      {category.name}
                    </h3>
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white shadow-sm transition group-hover:translate-x-0.5 ${tone.accent}`}>
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
