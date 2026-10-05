import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { Reveal } from "@/components/ui/reveal";
import type { Product } from "@/types";

interface ProductSectionProps { title: string; subtitle?: string; accent?: string; products: Product[]; viewAllHref?: string; viewAllLabel?: string; dark?: boolean }

export function ProductSection({ title, subtitle, accent, products, viewAllHref, viewAllLabel = "View all" }: ProductSectionProps) {
  return (
    <section className="bg-[#fff8ee] py-14 sm:py-16 lg:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-5 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl"><p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-[#f06a9f]">{accent}</p><h2 className="font-serif text-3xl font-bold tracking-tight text-[#175a9f] sm:text-4xl">{title}</h2>{subtitle && <p className="mt-3 text-sm leading-6 text-[#5d7790] sm:text-base">{subtitle}</p>}</div>
          {viewAllHref && <Link href={viewAllHref} className="group inline-flex items-center gap-2 self-start rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#248fd6] shadow-sm ring-1 ring-[#d8edf9] transition hover:-translate-y-0.5 hover:bg-[#eaf7ff] sm:self-auto">{viewAllLabel}<ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></Link>}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">{products.map((product, index) => <Reveal key={product.id} delay={(index % 4) * 0.05} className="h-full"><ProductCard product={product} /></Reveal>)}</div>
      </div>
    </section>
  );
}
