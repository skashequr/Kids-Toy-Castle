"use client";

import { MessageCircle } from "lucide-react";
import { useStoreInformation, useStorePrice } from "@/components/store-information-provider";
import { whatsappHref } from "@/lib/store-information";
import { buildWhatsAppOrderUrl } from "@/lib/whatsapp-order";
import { cn } from "@/lib/utils";

type Props = {
  product: { name: string; slug: string; price: number; variants?: unknown[] };
  quantity?: number;
  variantLabel?: string;
  className?: string;
};

export function WhatsAppOrderButton({ product, quantity = 1, variantLabel, className }: Props) {
  const store = useStoreInformation();
  const formatPrice = useStorePrice();
  const available = Boolean(whatsappHref(store.whatsapp));
  return (
    <button
      type="button"
      disabled={!available}
      aria-label={`${product.name} WhatsApp-এ অর্ডার করুন`}
      title={available ? "WhatsApp-এ অর্ডার করুন" : "WhatsApp অর্ডার এখন উপলব্ধ নয়"}
      onClick={() => {
        const url = buildWhatsAppOrderUrl(store.whatsapp, {
          name: product.name,
          slug: product.slug,
          priceLabel: formatPrice(product.price),
          quantity,
          variantLabel,
          hasVariants: Boolean(product.variants?.length),
        }, window.location.origin);
        if (url) window.open(url, "_blank", "noopener,noreferrer");
      }}
      className={cn("flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-[#e7f8ed] px-2 text-xs font-bold text-[#187744] transition hover:bg-[#1d9656] hover:text-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#e7f8ed] disabled:hover:text-[#187744]", className)}
    >
      <MessageCircle className="h-4 w-4 shrink-0" /> WhatsApp অর্ডার
    </button>
  );
}
