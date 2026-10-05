import type { Metadata } from "next";
import type { Category, Product } from "@/types";
import type { StoreInformation } from "./store-information";
import { safeStoreUrl } from "./store-information";
import { richTextToPlainText } from "./rich-text";

export const SITE_URL = "https://kidstoycastle.com";
export const HOME_TITLE = "Kids Play Tent, Baby Tent & Playpen in Bangladesh";
export const HOME_DESCRIPTION = "Shop kids play tents, baby play tents, castle tent houses, baby playpens and baby toys at KidsToyCastle. Cash on Delivery and delivery across Bangladesh.";

export function siteUrl(path: string) { return new URL(path, `${SITE_URL}/`).href; }
export function seoDescription(value: string) {
  return richTextToPlainText(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160);
}
export function seoImage(image?: string) {
  const safe = image ? safeStoreUrl(image, true) : "";
  return siteUrl(safe && !safe.endsWith(".ico") ? safe : "/cover.png");
}
export function pageMetadata(title: string, description: string, path: string, store: StoreInformation, image?: string): Metadata {
  const fullTitle = `${title} | ${store.storeName}`;
  return {
    title: { absolute: fullTitle }, description, alternates: { canonical: siteUrl(path) },
    openGraph: { type: "website", locale: "en_BD", siteName: store.storeName, title: fullTitle, description, url: siteUrl(path), images: [{ url: seoImage(image || store.logo), alt: title }] },
    twitter: { card: "summary_large_image", title: fullTitle, description, images: [seoImage(image || store.logo)] },
  };
}
export function serializeJsonLd(data: unknown) { return JSON.stringify(data).replace(/</g, "\\u003c"); }

export function itemList(name: string, id: string, items: Array<{ name: string; path: string }>) {
  return { "@type": "ItemList", "@id": siteUrl(id), name,
    itemListOrder: "https://schema.org/ItemListOrderAscending", numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, url: siteUrl(item.path) })) };
}
export function homeStructuredData(store: StoreInformation, products: Product[], categories: Category[]) {
  const name = `${HOME_TITLE} | ${store.storeName}`;
  const description = HOME_DESCRIPTION.replaceAll("KidsToyCastle", store.storeName);
  const logo = seoImage(store.logo.endsWith(".ico") ? "/logo.png" : store.logo);
  return { "@context": "https://schema.org", "@graph": [
    { "@type": "OnlineStore", "@id": siteUrl("/#organization"), name: store.storeName, url: siteUrl("/"), description,
      logo: { "@type": "ImageObject", url: logo }, image: logo,
      ...(store.phone ? { telephone: store.phone, contactPoint: { "@type": "ContactPoint", telephone: store.phone, contactType: "customer service", availableLanguage: ["English", "Bengali"] } } : {}),
      ...(store.email ? { email: store.email } : {}),
      currenciesAccepted: "BDT", paymentAccepted: "Cash on Delivery", areaServed: { "@type": "Country", name: "Bangladesh" },
      sameAs: [store.facebook, store.instagram, store.youtube].filter(Boolean),
    },
    { "@type": "WebSite", "@id": siteUrl("/#website"), url: siteUrl("/"), name: store.storeName, description,
      publisher: { "@id": siteUrl("/#organization") }, inLanguage: ["en", "bn"] },
    { "@type": "WebPage", "@id": siteUrl("/#webpage"), url: siteUrl("/"), name, description,
      isPartOf: { "@id": siteUrl("/#website") }, about: { "@id": siteUrl("/#organization") }, inLanguage: "en-BD" },
    itemList("Kids Play Tents and Baby Play Products", "/#featured-products", products.map((p) => ({ name: p.name, path: `/product/${encodeURIComponent(p.slug)}` }))),
    itemList(`${store.storeName} Product Categories`, "/#categories", categories.map((c) => ({ name: c.name, path: `/category/${encodeURIComponent(c.slug)}` }))),
  ] };
}
