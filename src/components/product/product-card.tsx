"use client";

import { useStorePrice } from "@/components/store-information-provider";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { calculateDiscount, cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart";
import { useWishlistStore } from "@/store/wishlist";
import { toast } from "@/components/ui/toaster";
import type { Product } from "@/types";
import { WhatsAppOrderButton } from "@/components/product/whatsapp-order-button";

export function ProductCard({ product, className }: { product: Product; className?: string }) {
  const formatPrice = useStorePrice();
  const [hovered, setHovered] = useState(false);
  const { addItem } = useCartStore();
  const { toggleItem, isWishlisted } = useWishlistStore();
  const wishlisted = isWishlisted(product.id);
  const discount = product.comparePrice ? calculateDiscount(product.comparePrice, product.price) : 0;
  const image = product.images[0];

  return <article className={cn("group relative overflow-hidden rounded-2xl border border-[#d9edf8] bg-white shadow-[0_6px_16px_rgba(43,123,174,.06)] transition duration-300 hover:-translate-y-1 hover:border-[#9ed6f5] hover:shadow-[0_13px_28px_rgba(43,123,174,.13)]", className)} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
    <Link href={`/product/${product.slug}`}><div className="relative aspect-[1/1.05] overflow-hidden bg-[#eaf7ff]">{image ? <Image src={image.url} alt={image.alt} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className={cn("object-cover transition duration-500", hovered && "scale-105")} /> : <span className="grid h-full place-items-center text-4xl">🧸</span>}<div className="absolute left-2 top-2 flex flex-col gap-1">{product.isNew && <span className="rounded-full bg-[#248fd6] px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-white">New</span>}{discount > 0 && <span className="rounded-full bg-[#f06a9f] px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-white">−{discount}%</span>}</div></div><div className="p-3"><p className="text-[9px] font-bold uppercase tracking-[.13em] text-[#2d92ce]">{product.category.name}</p><h3 className="mt-1 line-clamp-2 min-h-10 text-[13px] font-bold leading-5 text-[#234963]">{product.name}</h3><div className="mt-2 flex items-center gap-1"><span className="flex text-[#f0b52a]">{Array.from({ length: 5 }).map((_, index) => <Star key={index} className={cn("h-3 w-3", index < Math.round(product.rating) ? "fill-current" : "text-[#d8e9f3]")} />)}</span><span className="text-[10px] text-[#829bac]">{product.reviewCount}</span></div><div className="mt-2 flex items-baseline gap-1.5"><span className="text-[15px] font-bold text-[#e8548b]">{formatPrice(product.price)}</span>{product.comparePrice && <span className="text-[10px] text-[#95aab8] line-through">{formatPrice(product.comparePrice)}</span>}</div></div></Link>
    <button type="button" aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"} onClick={(event) => { event.preventDefault(); toggleItem(product); toast.info(wishlisted ? "Removed from wishlist" : "Added to wishlist"); }} className={cn("absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full border bg-white/90 transition", wishlisted ? "border-[#f06a9f] text-[#f06a9f]" : "border-white text-[#66869d] hover:text-[#f06a9f]")}><Heart className={cn("h-3.5 w-3.5", wishlisted && "fill-current")} /></button>
    <div className="space-y-2 px-3 pb-3"><button type="button" onClick={() => { if (product.variants?.length) { window.location.href = `/product/${product.slug}`; return; } addItem(product); toast.success("Product added to your cart"); }} className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-[#e5f5ff] text-xs font-bold text-[#227bb6] transition hover:bg-[#248fd6] hover:text-white"><ShoppingBag className="h-3.5 w-3.5" /> {product.variants?.length ? "ভ্যারিয়েন্ট বেছে নিন" : "কার্টে যোগ করুন"}</button><WhatsAppOrderButton product={product} /></div>
  </article>;
}
