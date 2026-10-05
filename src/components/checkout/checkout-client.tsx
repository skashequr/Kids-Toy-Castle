"use client";

import { useStorePrice } from "@/components/store-information-provider";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Check, CreditCard, MapPin, ShieldCheck, ShoppingBag, User } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { validateCheckoutContact } from "@/lib/checkout-validation";
import { toast } from "@/components/ui/toaster";
import { createOrder } from "@/server/actions/orders";
import { trackPurchase } from "@/lib/analytics-client";
import type { PaymentMethod } from "@/types";

const BANGLADESH_DISTRICTS = ["Dhaka", "Chittagong", "Rajshahi", "Khulna", "Barishal", "Sylhet", "Mymensingh", "Rangpur", "Comilla", "Gazipur", "Narayanganj"];

const inputClass = (error?: string) => cn(
  "h-12 w-full rounded-xl border bg-white px-3.5 text-sm text-[#234963] outline-none transition placeholder:text-[#9aaebc]",
  error ? "border-[#ef6a91] ring-4 ring-[#ffe4ed]" : "border-[#cfe4f1] focus:border-[#319bdf] focus:ring-4 focus:ring-[#dff3ff]"
);

export function CheckoutClient() {
  const formatPrice = useStorePrice();
  const { items, subtotal, discount, shipping, total, couponCode, clearCart } = useCartStore();
  const [paymentMethod] = useState<PaymentMethod>("cash_on_delivery");
  const [orderId, setOrderId] = useState("");
  const [placing, setPlacing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", address: "", area: "", city: "", district: "", postalCode: "" });
  const [errors, setErrors] = useState<Partial<typeof form>>({});

  const update = (field: keyof typeof form, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: "" }));
  };

  const validateAll = () => {
    const nextErrors = validateCheckoutContact(form);
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const placeOrder = async () => {
    if (!validateAll()) {
      toast.error("প্রয়োজনীয় তথ্যগুলো পূরণ করুন");
      return;
    }
    try {
      setPlacing(true);
      const response = await createOrder({
        ...form,
        items: items.map((item) => ({
          productId: item.product.id,
          name: item.product.name,
          slug: item.product.slug,
          image: item.variant?.image || item.product.images[0]?.url,
          variantId: item.variant?.id,
          variantSku: item.variant?.sku,
          variantLabel: item.variant ? [item.variant.name, item.variant.color, item.variant.size].filter(Boolean).join(" / ") || item.variant.sku : undefined,
          quantity: item.quantity,
          price: item.price,
        })),
        subtotal,
        discount,
        shipping,
        total,
        couponCode,
        paymentMethod,
      });
      if (response.ok && response.orderNumber) {
        trackPurchase(response.orderNumber, total, items.map((item) => ({
          id: item.product.id, quantity: item.quantity, price: item.price,
        })));
        setOrderId(response.orderNumber);
        setOrderPlaced(true);
        clearCart();
        toast.success("অর্ডারটি সফলভাবে নেওয়া হয়েছে");
      } else {
        toast.error(response.error ?? "অর্ডারটি নেওয়া যায়নি। আবার চেষ্টা করুন।");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setPlacing(false);
    }
  };

  if (items.length === 0 && !orderPlaced) {
    return <div className="mx-auto grid min-h-[48vh] max-w-md place-items-center px-4 text-center"><div><span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#e4f5ff] text-[#248fd6]"><ShoppingBag className="h-7 w-7" /></span><h2 className="mt-5 font-serif text-3xl font-bold text-[#1b588b]">আপনার কার্ট খালি</h2><p className="mt-2 text-sm leading-6 text-[#6b8497]">পছন্দের খেলনা কার্টে যোগ করে আবার ফিরে আসুন।</p><Link href="/new-arrivals" className="mt-6 inline-flex rounded-xl bg-[#f06a9f] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#da4e87]">খেলনা দেখুন</Link></div></div>;
  }

  if (orderPlaced) {
    return <section className="mx-auto grid min-h-[55vh] max-w-xl place-items-center py-10 text-center"><div className="w-full rounded-3xl border border-[#d8edf9] bg-white p-8 shadow-[0_14px_35px_rgba(46,128,179,.1)] sm:p-10"><span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#e3f8e6] text-[#39915a]"><Check className="h-8 w-8" /></span><p className="mt-5 text-xs font-bold uppercase tracking-[.18em] text-[#319bdf]">অর্ডার কনফার্মড</p><h2 className="mt-2 font-serif text-3xl font-bold text-[#1b588b]">ধন্যবাদ!</h2><p className="mt-3 text-sm leading-6 text-[#6b8497]">আপনার অর্ডারটি সফলভাবে নেওয়া হয়েছে। শিপমেন্টের সময় SMS আপডেট পাঠানো হবে।</p><p className="mt-5 rounded-xl bg-[#f2faff] px-4 py-3 font-mono text-sm font-bold text-[#236b9e]">Order: {orderId}</p><div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row"><Link href={`/track-order?order=${encodeURIComponent(orderId)}`} className="rounded-xl bg-[#248fd6] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1478bd]">অর্ডার ট্র্যাক করুন</Link><Link href="/" className="rounded-xl border border-[#bddff2] px-5 py-3 text-sm font-bold text-[#236b9e] transition hover:bg-[#f2faff]">শপিং চালিয়ে যান</Link></div></div></section>;
  }

  return (
    <div className="bg-[#f5fbff] py-7 sm:py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><Link href="/new-arrivals" className="inline-flex items-center gap-1 text-sm font-semibold text-[#587a94] transition hover:text-[#248fd6]"><ArrowLeft className="h-4 w-4" /> শপিংয়ে ফিরে যান</Link><h1 className="mt-3 font-serif text-3xl font-bold text-[#1b588b] sm:text-4xl">চেকআউট</h1><p className="mt-1 text-sm text-[#6b8497]">কয়েকটি তথ্য দিন, অর্ডারটি আমরা আপনার কাছে পৌঁছে দেব।</p></div>
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#3a8957]"><ShieldCheck className="h-5 w-5" /> নিরাপদ অর্ডার প্রসেস</p>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
            <CheckoutSection number="1" title="যোগাযোগের তথ্য" icon={<User className="h-5 w-5" />}>
              <div className="grid gap-4 sm:grid-cols-2"><Field label="আপনার নাম" error={errors.fullName}><input value={form.fullName} onChange={(event) => update("fullName", event.target.value)} placeholder="যেমন: রহিম আহমেদ" autoComplete="name" className={inputClass(errors.fullName)} /></Field><Field label="মোবাইল নম্বর" error={errors.phone}><input type="tel" value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="01XXXXXXXXX" autoComplete="tel" className={inputClass(errors.phone)} /></Field></div>
              <div className="mt-4"><Field label="ইমেইল ঠিকানা (ঐচ্ছিক)" optional error={errors.email}><input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="name@email.com" autoComplete="email" className={inputClass(errors.email)} /></Field></div>
            </CheckoutSection>

            <CheckoutSection number="2" title="ডেলিভারির ঠিকানা" icon={<MapPin className="h-5 w-5" />}>
              <Field label="বিস্তারিত ঠিকানা" error={errors.address}><input value={form.address} onChange={(event) => update("address", event.target.value)} placeholder="বাড়ি/ফ্ল্যাট, রোড নম্বর" autoComplete="street-address" className={inputClass(errors.address)} /></Field>
              <div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="জেলা (ঐচ্ছিক)" optional><select value={form.district} onChange={(event) => update("district", event.target.value)} className={inputClass()}><option value="">জেলা নির্বাচন করুন (ঐচ্ছিক)</option>{BANGLADESH_DISTRICTS.map((district) => <option key={district} value={district}>{district}</option>)}</select></Field><Field label="শহর (ঐচ্ছিক)" optional error={errors.city}><input value={form.city} onChange={(event) => update("city", event.target.value)} placeholder="যেমন: Dhaka" autoComplete="address-level2" className={inputClass(errors.city)} /></Field><Field label="এলাকা / থানা (ঐচ্ছিক)" optional error={errors.area}><input value={form.area} onChange={(event) => update("area", event.target.value)} placeholder="যেমন: Mirpur" className={inputClass(errors.area)} /></Field><Field label="পোস্ট কোড (ঐচ্ছিক)" optional><input value={form.postalCode} onChange={(event) => update("postalCode", event.target.value)} placeholder="1216" autoComplete="postal-code" className={inputClass()} /></Field></div>
            </CheckoutSection>

            <CheckoutSection number="3" title="পেমেন্ট" icon={<CreditCard className="h-5 w-5" />}>
              <div className="flex items-center gap-3 rounded-2xl border border-[#bfe1f4] bg-[#f4fbff] p-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#ffe8b1] text-xl">💵</span><div className="min-w-0 flex-1"><p className="font-bold text-[#234963]">ক্যাশ অন ডেলিভারি</p><p className="mt-0.5 text-sm text-[#6b8497]">পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন।</p></div><span className="grid h-5 w-5 place-items-center rounded-full border-[5px] border-[#248fd6] bg-white" aria-label="Selected" /></div>
            </CheckoutSection>

            <Button type="button" size="lg" onClick={placeOrder} isLoading={placing} className="h-14 w-full rounded-2xl bg-[#f06a9f] text-base font-bold text-white shadow-[0_10px_24px_rgba(240,106,159,.28)] hover:bg-[#da4e87]">{placing ? "অর্ডার করা হচ্ছে..." : `অর্ডার কনফার্ম করুন · ${formatPrice(total)}`}</Button>
          </div>

          <aside className="lg:sticky lg:top-24"><OrderSummary items={items} subtotal={subtotal} discount={discount} shipping={shipping} total={total} couponCode={couponCode} /></aside>
        </div>
      </div>
    </div>
  );
}

function CheckoutSection({ number, title, icon, children }: { number: string; title: string; icon: ReactNode; children: ReactNode }) {
  return <section className="rounded-3xl border border-[#d8edf9] bg-white p-5 shadow-[0_8px_22px_rgba(46,128,179,.06)] sm:p-6"><div className="mb-5 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e4f5ff] text-sm font-bold text-[#248fd6]">{number}</span><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#fff0c8] text-[#bd7900]">{icon}</span><h2 className="text-lg font-bold text-[#234963]">{title}</h2></div>{children}</section>;
}

function Field({ label, error, optional = false, children }: { label: string; error?: string; optional?: boolean; children: ReactNode }) {
  return <label className="block text-sm font-semibold text-[#46677f]"><span>{label} {!optional && <em className="not-italic text-[#ef6a91]">*</em>}</span><div className="mt-2">{children}</div>{error && <p className="mt-1.5 text-xs font-medium text-[#d94d74]">{error}</p>}</label>;
}

function OrderSummary({ items, subtotal, discount, shipping, total, couponCode }: { items: ReturnType<typeof useCartStore.getState>["items"]; subtotal: number; discount: number; shipping: number; total: number; couponCode?: string }) {
  const formatPrice = useStorePrice();
  return <section className="rounded-3xl border border-[#d8edf9] bg-white p-5 shadow-[0_10px_28px_rgba(46,128,179,.08)] sm:p-6"><div className="flex items-center justify-between border-b border-[#e8f3f9] pb-4"><div><h2 className="font-serif text-2xl font-bold text-[#1b588b]">অর্ডার সারাংশ</h2><p className="mt-1 text-xs text-[#7895aa]">{items.length}টি আইটেম</p></div><ShoppingBag className="h-5 w-5 text-[#f06a9f]" /></div><div className="max-h-72 space-y-3 overflow-y-auto py-4">{items.map((item) => <div key={item.id} className="flex gap-3"><div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#edf8ff]">{(item.variant?.image || item.product.images[0]?.url) ? <Image src={item.variant?.image || item.product.images[0].url} alt={item.product.name} fill sizes="56px" className="object-cover" /> : <span className="grid h-full place-items-center">🧸</span>}<span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#f06a9f] px-1 text-[10px] font-bold text-white">{item.quantity}</span></div><div className="min-w-0 flex-1"><p className="line-clamp-2 text-sm font-bold leading-5 text-[#234963]">{item.product.name}</p>{item.variant && <p className="mt-0.5 text-xs text-[#7895aa]">{[item.variant.name, item.variant.color, item.variant.size].filter(Boolean).join(" / ") || item.variant.sku}</p>}<p className="mt-1 text-sm font-bold text-[#e8548b]">{formatPrice(item.price * item.quantity)}</p></div></div>)}</div><div className="space-y-3 border-t border-[#e8f3f9] pt-4 text-sm"><TotalRow label="সাবটোটাল" value={formatPrice(subtotal)} />{discount > 0 && <TotalRow label={couponCode ? `ডিসকাউন্ট (${couponCode})` : "ডিসকাউন্ট"} value={`-${formatPrice(discount)}`} highlight /> }<TotalRow label="ডেলিভারি চার্জ" value={shipping === 0 ? "ফ্রি" : formatPrice(shipping)} highlight={shipping === 0} /><div className="flex items-center justify-between border-t border-[#d7ebf7] pt-4"><span className="text-base font-bold text-[#234963]">সর্বমোট</span><span className="text-xl font-bold text-[#e8548b]">{formatPrice(total)}</span></div></div><div className="mt-5 flex gap-3 rounded-2xl bg-[#eaf8ef] p-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#3a8957]" /><p className="text-xs leading-5 text-[#39734d]">আপনার তথ্য নিরাপদ। অর্ডার কনফার্ম হওয়ার পর আমাদের টিম আপনার সঙ্গে যোগাযোগ করবে।</p></div></section>;
}

function TotalRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) { return <div className="flex justify-between gap-4"><span className="text-[#6b8497]">{label}</span><span className={cn("font-semibold", highlight ? "text-[#3a8957]" : "text-[#234963]")}>{value}</span></div>; }
