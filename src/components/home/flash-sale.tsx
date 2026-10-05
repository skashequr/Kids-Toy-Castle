"use client";

import { useStorePrice } from "@/components/store-information-provider";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Sparkles, Zap } from "lucide-react";

import { useCartStore } from "@/store/cart";
import { toast } from "@/components/ui/toaster";
import type { FlashSaleProduct } from "@/types";
import { WhatsAppOrderButton } from "@/components/product/whatsapp-order-button";

function useCountdown(targetDate?: string) {
  const [remaining, setRemaining] = useState({ hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    if (!targetDate) return;
    const update = () => {
      const difference = Math.max(0, new Date(targetDate).getTime() - Date.now());
      setRemaining({ hours: Math.floor(difference / 3_600_000), minutes: Math.floor((difference % 3_600_000) / 60_000), seconds: Math.floor((difference % 60_000) / 1_000) });
    };
    update();
    const timer = window.setInterval(update, 1_000);
    return () => window.clearInterval(timer);
  }, [targetDate]);
  return remaining;
}

export function FlashSale({ products }: { products: FlashSaleProduct[] }) {
  const formatPrice = useStorePrice();
  const { addItem } = useCartStore();
  const countdown = useCountdown(products[0]?.saleEndsAt);

  if (products.length === 0) return <section className="bg-[#f6fbff] py-16"><div className="container mx-auto px-4 text-center"><span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#fff0c5] text-[#e39a00]"><Zap className="h-7 w-7" /></span><h2 className="mt-5 font-serif text-3xl font-bold text-[#1b588b]">নতুন অফার আসছে শিগগিরই</h2><p className="mt-2 text-sm text-[#6b8497]">আমাদের নতুন খেলনার কালেকশন ঘুরে দেখুন।</p><Link href="/new-arrivals" className="mt-5 inline-flex rounded-xl bg-[#f06a9f] px-5 py-3 text-sm font-bold text-white">নতুন খেলনা দেখুন</Link></div></section>;

  return <section className="bg-[#f6fbff] py-10 sm:py-14"><div className="container mx-auto px-4 sm:px-6 lg:px-8"><div className="mb-7 flex flex-col gap-5 rounded-3xl bg-[#248fd6] px-5 py-6 text-white shadow-[0_14px_32px_rgba(36,143,214,.18)] sm:flex-row sm:items-center sm:justify-between sm:px-7"><div><p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-[#ffe783]"><Sparkles className="h-3.5 w-3.5" /> আজকের বিশেষ মূল্য</p><h2 className="mt-2 font-serif text-3xl font-bold">দাম কম, আনন্দ বেশি!</h2><p className="mt-1 text-sm text-white/80">পছন্দের খেলনা বিশেষ দামে নিন।</p></div><div className="flex gap-2">{[[countdown.hours, "ঘন্টা"], [countdown.minutes, "মিনিট"], [countdown.seconds, "সেকেন্ড"]].map(([value, label]) => <div key={label as string} className="min-w-14 rounded-xl bg-white/15 px-3 py-2 text-center"><b className="block font-mono text-xl tabular-nums">{String(value).padStart(2, "0")}</b><span className="text-[10px] text-white/70">{label as string}</span></div>)}</div></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">{products.map((product) => { const discount = product.price > 0 ? Math.round(((product.price - product.flashPrice) / product.price) * 100) : 0; const availability = Math.max(0, product.flashStock - product.soldCount); const progress = product.flashStock ? Math.min(100, Math.round((product.soldCount / product.flashStock) * 100)) : 0; return <article key={product.id} className="group overflow-hidden rounded-2xl border border-[#d8edf9] bg-white shadow-[0_7px_18px_rgba(46,128,179,.07)] transition hover:-translate-y-1 hover:shadow-[0_14px_28px_rgba(46,128,179,.13)]"><Link href={`/product/${product.slug}`}><div className="relative aspect-square overflow-hidden bg-[#eaf7ff]">{product.images[0] ? <Image src={product.images[0].url} alt={product.name} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className="object-cover transition duration-500 group-hover:scale-105" /> : <span className="grid h-full place-items-center text-4xl">🧸</span>}<span className="absolute left-2 top-2 rounded-full bg-[#f06a9f] px-2 py-1 text-[10px] font-bold text-white">-{discount}%</span></div><div className="p-3 sm:p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-[#2687c6]">{product.category.name}</p><h3 className="mt-1 line-clamp-2 min-h-10 text-sm font-bold leading-5 text-[#234963]">{product.name}</h3><div className="mt-2 flex items-baseline gap-1.5"><span className="text-base font-bold text-[#e8548b]">{formatPrice(product.flashPrice)}</span><span className="text-[11px] text-[#94a9b7] line-through">{formatPrice(product.price)}</span></div><div className="mt-3"><div className="mb-1 flex justify-between text-[10px] text-[#718da1]"><span>{product.soldCount} sold</span><span>{availability} left</span></div><div className="h-1.5 overflow-hidden rounded-full bg-[#eaf3f8]"><div className="h-full rounded-full bg-[#f6bd31]" style={{ width: `${progress}%` }} /></div></div></div></Link><div className="space-y-2 px-3 pb-3 sm:px-4 sm:pb-4"><button type="button" onClick={() => { if (product.variants?.length) { window.location.href = `/product/${product.slug}`; return; } addItem({ ...product, price: product.flashPrice }); toast.success("Flash sale price added to your cart"); }} className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-[#f06a9f] text-xs font-bold text-white transition hover:bg-[#db4e87]"><ShoppingBag className="h-3.5 w-3.5" /> {product.variants?.length ? "ভ্যারিয়েন্ট বেছে নিন" : "কার্টে যোগ করুন"}</button><WhatsAppOrderButton product={{ ...product, price: product.flashPrice }} className="h-10" /></div></article>; })}</div></div></section>;
}
