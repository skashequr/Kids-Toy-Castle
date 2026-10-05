import { whatsappHref } from "@/lib/store-information";

export type WhatsAppOrderDetails = {
  name: string;
  slug: string;
  priceLabel: string;
  quantity?: number;
  variantLabel?: string;
  hasVariants?: boolean;
};

export function buildWhatsAppOrderUrl(phone: string, product: WhatsAppOrderDetails, origin: string): string {
  const destination = whatsappHref(phone);
  if (!destination) return "";
  let website: URL;
  try {
    website = new URL(origin);
    if (!["http:", "https:"].includes(website.protocol)) return "";
  } catch {
    return "";
  }
  const productUrl = `${website.origin}/product/${encodeURIComponent(product.slug)}`;
  const message = [
    "আসসালামু আলাইকুম, আমি এই পণ্যটি অর্ডার করতে চাই।",
    `পণ্য: ${product.name}`,
    `প্রদর্শিত মূল্য: ${product.priceLabel}`,
    `পরিমাণ: ${product.quantity ?? 1}`,
    product.variantLabel ? `ভ্যারিয়েন্ট: ${product.variantLabel}` : product.hasVariants ? "ভ্যারিয়েন্ট / রঙ / সাইজ চ্যাটে নিশ্চিত করব।" : "",
    `লিংক: ${productUrl}`,
    "ডেলিভারিসহ মোট মূল্য ও অর্ডার কনফার্ম করার নিয়ম জানাবেন।",
  ].filter(Boolean).join("\n");
  return `${destination}?text=${encodeURIComponent(message)}`;
}
