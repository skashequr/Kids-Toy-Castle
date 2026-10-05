"use client";

import Link from "next/link";
import { useStoreInformation } from "@/components/store-information-provider";
import { storePhoneHref, whatsappHref } from "@/lib/store-information";

const links = [
  { href: "/new-arrivals", label: "New arrivals" },
  { href: "/about", label: "Our story" },
  { href: "/contact", label: "Contact" },
  { href: "/faq", label: "FAQ" },
  { href: "/privacy-policy", label: "Privacy" },
];

export function Footer() {
  const store = useStoreInformation();
  const socialLinks = [
    { label: "Facebook", href: store.facebook },
    { label: "Instagram", href: store.instagram },
    { label: "YouTube", href: store.youtube },
    { label: "WhatsApp", href: whatsappHref(store.whatsapp) },
  ].filter((link) => link.href);
  return (
    <footer className="mt-16 bg-[#122630] text-[#f8f3e8]">
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 border-b border-white/10 pb-8 md:flex-row md:items-end md:justify-between">
          <Link href="/" className="group inline-flex items-center gap-3"><span role="img" aria-label={`${store.storeName} logo`} className="h-11 w-11 shrink-0 rounded-full bg-white bg-cover bg-center ring-2 ring-[#ff8dbb]/60" style={{ backgroundImage: `url(${JSON.stringify(store.logo)})` }} /><span><span className="block font-serif text-xl font-bold tracking-[.04em]">{store.storeName}</span>{store.tagline && <span className="block text-xs text-[#ffb4d1]">{store.tagline}</span>}</span></Link>
          <nav className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-[#f8f3e8]/70">{links.map((link) => <Link key={link.href} href={link.href} className="transition hover:text-[#e8c778]">{link.label}</Link>)}</nav>
        </div>
        <div className="flex flex-col gap-4 border-b border-white/10 py-6 text-sm text-[#f8f3e8]/70 sm:flex-row sm:justify-between">
          <div className="space-y-2">
            {store.address && <p className="whitespace-pre-line">{store.address}</p>}
            {store.email && <a className="block hover:text-[#e8c778]" href={`mailto:${store.email}`}>{store.email}</a>}
            {storePhoneHref(store.phone) && <a className="block hover:text-[#e8c778]" href={storePhoneHref(store.phone)}>{store.phone}</a>}
          </div>
          {socialLinks.length > 0 && <nav aria-label="Social links" className="flex flex-wrap gap-4">{socialLinks.map((link) => <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className="hover:text-[#e8c778]">{link.label}</a>)}</nav>}
        </div>
        <div className="flex flex-col gap-2 pt-6 text-xs text-[#f8f3e8]/45 sm:flex-row sm:justify-between"><span>© {new Date().getFullYear()} {store.storeName}. All rights reserved.</span><span>খেলনায় আনন্দ · পরিবারের ভরসা</span></div>
      </div>
    </footer>
  );
}
