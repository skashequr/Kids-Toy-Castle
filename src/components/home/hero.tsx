"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export type StorefrontBanner = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  link: string;
};

const FALLBACK_BANNER: StorefrontBanner = {
  id: "fallback",
  title: "খেলায় খেলায় বড় হোক কল্পনার রাজ্য",
  subtitle: "মজার, রঙিন আর শিশুবান্ধব খেলনার কালেকশন—প্রতিদিনের খেলাকে করে তুলুক আরও বিশেষ।",
  image: "/cover.png",
  link: "/new-arrivals",
};

export function Hero({ banners = [] }: { banners?: StorefrontBanner[] }) {
  const slides = banners.length > 0 ? banners : [FALLBACK_BANNER];
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = window.setInterval(() => setCurrent((index) => (index + 1) % slides.length), 6000);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  const currentIndex = current % slides.length;
  const slide = slides[currentIndex];
  const goTo = (index: number) => setCurrent((index + slides.length) % slides.length);

  return (
    <section className="overflow-hidden bg-[#fff8ee] pb-12 pt-5 sm:pb-16 sm:pt-7">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="group relative aspect-[2014/781] overflow-hidden rounded-[1.5rem] border-4 border-white bg-[#ccecff] shadow-[0_18px_48px_rgba(59,130,246,.18)] sm:rounded-[2.5rem]">
          <Link href={slide.link || "/"} aria-label={slide.title} className="absolute inset-0">
            <Image src={slide.image} alt={slide.title} fill priority={currentIndex === 0} sizes="(max-width: 1024px) 100vw, 1280px" className="object-cover transition-transform duration-700 group-hover:scale-[1.015]" />
          </Link>
          {slides.length > 1 && (
            <>
              <button type="button" aria-label="Previous banner" onClick={() => goTo(currentIndex - 1)} className="absolute left-3 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#175a9f] shadow-md transition hover:bg-white sm:left-5 sm:h-11 sm:w-11"><ChevronLeft className="h-5 w-5" /></button>
              <button type="button" aria-label="Next banner" onClick={() => goTo(currentIndex + 1)} className="absolute right-3 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#175a9f] shadow-md transition hover:bg-white sm:right-5 sm:h-11 sm:w-11"><ChevronRight className="h-5 w-5" /></button>
              <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-2 rounded-full bg-white/80 px-3 py-2 backdrop-blur-sm sm:bottom-5">
                {slides.map((item, index) => <button key={item.id} type="button" aria-label={`Show banner ${index + 1}`} onClick={() => goTo(index)} className={cn("h-2 rounded-full transition-all", index === currentIndex ? "w-7 bg-[#ff6da8]" : "w-2 bg-[#175a9f]/35 hover:bg-[#175a9f]/60")} />)}
              </div>
            </>
          )}
        </div>

        <div className="relative z-10 mx-auto -mt-4 max-w-3xl rounded-3xl border border-[#b8e1ff] bg-white px-5 py-6 text-center shadow-[0_12px_28px_rgba(59,130,246,.12)] sm:-mt-7 sm:px-8 sm:py-7">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#fff1a8] px-3 py-1 text-xs font-bold text-[#704600]"><Sparkles className="h-3.5 w-3.5" /> ছোট্ট সোনামণিদের আনন্দের জগৎ</div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-[#175a9f] sm:text-4xl">{slide.title}</h1>
          {slide.subtitle && <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[#526b85] sm:text-base">{slide.subtitle}</p>}
          <Link href={slide.link || "/"} className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#ff6da8] px-6 py-3 text-sm font-bold text-white shadow-[0_8px_16px_rgba(255,109,168,.28)] transition hover:-translate-y-0.5 hover:bg-[#ef5394]">খেলনা দেখুন <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </div>
    </section>
  );
}

export function HomepageBanners({ banners }: { banners: StorefrontBanner[] }) {
  if (banners.length === 0) return null;
  return (
    <section className="bg-[#fff8ee] py-8 sm:py-12">
      <div className="container mx-auto grid gap-5 px-4 sm:px-6 lg:px-8">
        {banners.map((banner) => (
          <Link key={banner.id} href={banner.link || "/"} className="group relative aspect-[2014/781] overflow-hidden rounded-[1.5rem] border-4 border-white bg-[#ccecff] shadow-[0_14px_36px_rgba(59,130,246,.14)] sm:rounded-[2rem]">
            <Image src={banner.image} alt={banner.title} fill sizes="(max-width: 1024px) 100vw, 1280px" className="object-cover transition-transform duration-700 group-hover:scale-[1.015]" />
            <span className="sr-only">{banner.title}{banner.subtitle ? ` — ${banner.subtitle}` : ""}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
