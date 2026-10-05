"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { normalizeStoreInformation } from "@/lib/store-information";
import { Save, Store, Truck, CreditCard, Bell, Globe, Shield, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { saveSettings } from "@/server/actions/settings";
import type { StoreSettings } from "@/server/services/settings";
import { toast } from "@/components/ui/toaster";

type Tab = "store" | "shipping" | "payment" | "notifications" | "seo" | "security";

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "store",         label: "Store Info",     icon: Store },
  { id: "shipping",      label: "Shipping",       icon: Truck },
  { id: "payment",       label: "Payment",        icon: CreditCard },
  { id: "notifications", label: "Notifications",  icon: Bell },
  { id: "seo",           label: "SEO & Pixel",    icon: Globe },
  { id: "security",      label: "Security",       icon: Shield },
];

export function AdminSettingsClient({ initial }: { initial: StoreSettings }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("store");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const [store, setStore] = useState(() => normalizeStoreInformation(initial.store));

  const [shipping, setShipping] = useState({
    freeShippingThreshold: "2000",
    defaultShippingCost: "120",
    insideDhaka: "80",
    outsideDhaka: "150",
    courier1: true, courier2: true, courier3: false, courier4: false,
    expressDelivery: true, expressCharge: "200",
    ...(initial.shipping as Record<string, unknown>),
  });

  const [payment, setPayment] = useState({
    bkash: true, nagad: true, rocket: true, cod: true, visa: true, mastercard: true,
    sslcommerz: false, bkashMerchant: "01700000000", nagadMerchant: "01700000000",
    ...(initial.payment as Record<string, unknown>),
  });

  const [notif, setNotif] = useState({
    emailNewOrder: true, emailOrderShipped: true, emailLowStock: true,
    smsNewOrder: false, smsOrderStatus: true,
    lowStockThreshold: "10",
    ...(initial.notifications as Record<string, unknown>),
  });

  const [seo, setSeo] = useState({
    metaTitle: "Kids Toy Castle — Magical Playthings & Adventure Awaits",
    metaDesc: "Colourful, joyful and child-friendly playthings for little imaginations.",
    ogImage: "/cover.png",
    googleAnalytics: "",
    facebookPixel: "",
    ...(initial.seo as Record<string, string>),
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSettings({ store, shipping, payment, notifications: notif, seo });
      router.refresh();
      setSaved(true);
      toast.success("Settings saved.");
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Settings could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const inp = "h-11 w-full rounded-xl border border-[#c9e3f2] bg-[#f8fcff] px-3.5 text-sm text-[#24445b] outline-none placeholder:text-[#9bb0be] transition focus:border-[#248fd6] focus:ring-4 focus:ring-[#248fd6]/10";
  const lbl = "mb-1.5 block text-[11px] font-bold uppercase tracking-[.08em] text-[#6f8da1]";

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-8 text-[#24445b]">
      <section className="relative overflow-hidden rounded-[2rem] bg-[#248fd6] px-6 py-7 text-white shadow-[0_16px_38px_rgba(36,143,214,.2)] sm:px-8">
        <div aria-hidden="true" className="absolute -right-10 -top-10 h-44 w-44 rounded-full border-[22px] border-white/10" />
        <div aria-hidden="true" className="absolute bottom-0 right-36 h-20 w-20 translate-y-1/2 rounded-full bg-[#fff1a8]/20" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-[#fff1a8]"><Sparkles className="h-3.5 w-3.5" /> Store control center</p><h1 className="mt-2 font-serif text-3xl font-bold sm:text-4xl">Settings</h1><p className="mt-2 max-w-xl text-sm leading-6 text-white/80">আপনার store, delivery, payment এবং tracking settings এক জায়গা থেকে নিয়ন্ত্রণ করুন।</p></div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={cn("flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-[0_8px_18px_rgba(116,42,83,.22)] transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70", saved ? "bg-[#65b96b]" : "bg-[#f06a9f] hover:bg-[#db4e87]")}
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
        </button>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
        {/* Sidebar */}
        <div>
          <nav className="grid grid-cols-2 gap-2 rounded-3xl border border-[#d8edf9] bg-white p-2 shadow-[0_8px_22px_rgba(46,128,179,.06)] sm:grid-cols-3 lg:grid-cols-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={cn("flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-bold transition-all", tab === id ? "bg-[#e4f5ff] text-[#176799] shadow-sm ring-1 ring-[#c9e9fa]" : "text-[#7895aa] hover:bg-[#f4faff] hover:text-[#248fd6]")}
              >
                <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-xl", tab === id ? "bg-[#248fd6] text-white" : "bg-[#f1f7fb] text-[#7c9bb0]")}><Icon className="h-4 w-4" /></span>
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="min-w-0 rounded-3xl border border-[#d8edf9] bg-white p-5 shadow-[0_8px_22px_rgba(46,128,179,.06)] sm:p-7">

          {tab === "store" && (
            <div className="space-y-4">
              <h2 className="mb-5 font-serif text-2xl font-bold text-[#175a9f]">Store information</h2>
              <p className="text-sm text-[#6f8da1]">Save করলে হোম পেজের নাম, লোগো, tagline, যোগাযোগ ও social links আপডেট হবে।</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div><label className={lbl}>Store Name</label><input value={store.storeName} onChange={(e) => setStore((p) => ({ ...p, storeName: e.target.value }))} className={inp} /></div>
                <div><label className={lbl}>Tagline</label><input value={store.tagline} onChange={(e) => setStore((p) => ({ ...p, tagline: e.target.value }))} className={inp} /></div>
                <div><label className={lbl}>Logo URL / Image Path</label><input value={store.logo} onChange={(e) => setStore((p) => ({ ...p, logo: e.target.value }))} placeholder="/logo.png or https://..." className={inp} /></div>
                <div><label className={lbl}>Favicon URL / Image Path</label><input value={store.favicon} onChange={(e) => setStore((p) => ({ ...p, favicon: e.target.value }))} placeholder="/favicon.ico or https://..." className={inp} /></div>
                <div><label className={lbl}>Contact Email</label><input type="email" value={store.email} onChange={(e) => setStore((p) => ({ ...p, email: e.target.value }))} className={inp} /></div>
                <div><label className={lbl}>Phone</label><input value={store.phone} onChange={(e) => setStore((p) => ({ ...p, phone: e.target.value }))} className={inp} /></div>
                <div className="sm:col-span-2"><label className={lbl}>Address</label><input value={store.address} onChange={(e) => setStore((p) => ({ ...p, address: e.target.value }))} className={inp} /></div>
                <div><label className={lbl}>Facebook URL</label><input value={store.facebook} onChange={(e) => setStore((p) => ({ ...p, facebook: e.target.value }))} className={inp} /></div>
                <div><label className={lbl}>Instagram URL</label><input value={store.instagram} onChange={(e) => setStore((p) => ({ ...p, instagram: e.target.value }))} className={inp} /></div>
                <div><label className={lbl}>YouTube URL</label><input value={store.youtube} onChange={(e) => setStore((p) => ({ ...p, youtube: e.target.value }))} className={inp} /></div>
                <div><label className={lbl}>WhatsApp Number</label><input value={store.whatsapp} onChange={(e) => setStore((p) => ({ ...p, whatsapp: e.target.value }))} className={inp} /></div>
                <div><label className={lbl}>Currency Symbol</label><input value={store.currencySymbol} onChange={(e) => setStore((p) => ({ ...p, currencySymbol: e.target.value }))} className={inp} /></div>
                <div><label className={lbl}>Currency Code</label><input value={store.currency} onChange={(e) => setStore((p) => ({ ...p, currency: e.target.value }))} className={inp} /></div>
              </div>
              <p className="text-xs text-[#6f8da1]">Currency settings শুধু মূল্য প্রদর্শনের format বদলায়; product price বা payment currency conversion করে না। বর্তমান payment BDT-তে থাকে।</p>
            </div>
          )}

          {tab === "shipping" && (
            <div className="space-y-4">
              <h2 className="mb-5 font-serif text-2xl font-bold text-[#175a9f]">Shipping settings</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div><label className={lbl}>Free Shipping Threshold (৳)</label><input type="number" value={shipping.freeShippingThreshold} onChange={(e) => setShipping((p) => ({ ...p, freeShippingThreshold: e.target.value }))} className={inp} /></div>
                <div><label className={lbl}>Default Shipping Cost (৳)</label><input type="number" value={shipping.defaultShippingCost} onChange={(e) => setShipping((p) => ({ ...p, defaultShippingCost: e.target.value }))} className={inp} /></div>
                <div><label className={lbl}>Inside Dhaka (৳)</label><input type="number" value={shipping.insideDhaka} onChange={(e) => setShipping((p) => ({ ...p, insideDhaka: e.target.value }))} className={inp} /></div>
                <div><label className={lbl}>Outside Dhaka (৳)</label><input type="number" value={shipping.outsideDhaka} onChange={(e) => setShipping((p) => ({ ...p, outsideDhaka: e.target.value }))} className={inp} /></div>
              </div>
              <div className="border-t border-[#e4eff6] pt-4">
                <p className={lbl}>Courier Partners</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[["courier1", "Steadfast"], ["courier2", "Pathao"], ["courier3", "RedX"], ["courier4", "Sundarban"]].map(([key, label]) => (
                    <label key={key} className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#d8e8f2] bg-[#f8fcff] p-3 transition-colors hover:border-[#8cc9ed]">
                      <input type="checkbox" checked={shipping[key as keyof typeof shipping] as boolean} onChange={(e) => setShipping((p) => ({ ...p, [key]: e.target.checked }))} className="h-4 w-4 accent-[#f06a9f]" />
                      <span className="text-sm font-medium">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <label className="flex flex-1 cursor-pointer items-center gap-3 rounded-xl border border-[#d8e8f2] bg-[#f8fcff] p-3 transition-colors hover:border-[#8cc9ed]">
                  <input type="checkbox" checked={shipping.expressDelivery} onChange={(e) => setShipping((p) => ({ ...p, expressDelivery: e.target.checked }))} className="h-4 w-4 accent-[#f06a9f]" />
                  <span className="text-sm font-medium">Express Delivery</span>
                </label>
                {shipping.expressDelivery && (
                  <div className="flex-1">
                    <label className={lbl}>Express Charge (৳)</label>
                    <input type="number" value={shipping.expressCharge} onChange={(e) => setShipping((p) => ({ ...p, expressCharge: e.target.value }))} className={inp} />
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === "payment" && (
            <div className="space-y-4">
              <h2 className="mb-5 font-serif text-2xl font-bold text-[#175a9f]">Payment methods</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  ["bkash", "bKash"], ["nagad", "Nagad"], ["rocket", "Rocket"],
                  ["cod", "Cash on Delivery"], ["visa", "Visa Card"], ["mastercard", "Mastercard"],
                  ["sslcommerz", "SSLCommerz"],
                ].map(([key, label]) => (
                  <label key={key} className={cn("flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors", payment[key as keyof typeof payment] ? "border-[#8cc9ed] bg-[#eaf7ff] text-[#176799]" : "border-[#d8e8f2] bg-[#f8fcff] hover:border-[#8cc9ed]")}>
                    <input type="checkbox" checked={payment[key as keyof typeof payment] as boolean} onChange={(e) => setPayment((p) => ({ ...p, [key]: e.target.checked }))} className="h-4 w-4 accent-[#f06a9f]" />
                    <span className="text-sm font-medium">{label}</span>
                  </label>
                ))}
              </div>
              <div className="grid grid-cols-1 gap-4 border-t border-[#e4eff6] pt-4 sm:grid-cols-2">
                <div><label className={lbl}>bKash Merchant Number</label><input value={payment.bkashMerchant} onChange={(e) => setPayment((p) => ({ ...p, bkashMerchant: e.target.value }))} className={inp} /></div>
                <div><label className={lbl}>Nagad Merchant Number</label><input value={payment.nagadMerchant} onChange={(e) => setPayment((p) => ({ ...p, nagadMerchant: e.target.value }))} className={inp} /></div>
              </div>
            </div>
          )}

          {tab === "notifications" && (
            <div className="space-y-4">
              <h2 className="mb-5 font-serif text-2xl font-bold text-[#175a9f]">Notification settings</h2>
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-[.12em] text-[#e8548b]">Email notifications</p>
                {[["emailNewOrder", "New Order Placed"], ["emailOrderShipped", "Order Shipped"], ["emailLowStock", "Low Stock Alert"]].map(([key, label]) => (
                  <label key={key} className="flex cursor-pointer items-center justify-between rounded-xl border border-[#d8e8f2] bg-[#f8fcff] p-3 transition-colors hover:border-[#8cc9ed]">
                    <span className="text-sm font-medium">{label}</span>
                    <input type="checkbox" checked={notif[key as keyof typeof notif] as boolean} onChange={(e) => setNotif((p) => ({ ...p, [key]: e.target.checked }))} className="h-4 w-4 accent-[#f06a9f]" />
                  </label>
                ))}
                <p className="mt-4 text-xs font-bold uppercase tracking-[.12em] text-[#e8548b]">SMS notifications</p>
                {[["smsNewOrder", "New Order Placed"], ["smsOrderStatus", "Order Status Change"]].map(([key, label]) => (
                  <label key={key} className="flex cursor-pointer items-center justify-between rounded-xl border border-[#d8e8f2] bg-[#f8fcff] p-3 transition-colors hover:border-[#8cc9ed]">
                    <span className="text-sm font-medium">{label}</span>
                    <input type="checkbox" checked={notif[key as keyof typeof notif] as boolean} onChange={(e) => setNotif((p) => ({ ...p, [key]: e.target.checked }))} className="h-4 w-4 accent-[#f06a9f]" />
                  </label>
                ))}
                <div><label className={lbl}>Low Stock Threshold</label><input type="number" value={notif.lowStockThreshold} onChange={(e) => setNotif((p) => ({ ...p, lowStockThreshold: e.target.value }))} min={1} className={inp} /></div>
              </div>
            </div>
          )}

          {tab === "seo" && (
            <div className="space-y-4">
              <h2 className="mb-5 font-serif text-2xl font-bold text-[#175a9f]">SEO & tracking</h2>
              <div><label className={lbl}>Meta Title</label><input value={seo.metaTitle} onChange={(e) => setSeo((p) => ({ ...p, metaTitle: e.target.value }))} className={inp} /></div>
              <div><label className={lbl}>Meta Description</label><textarea value={seo.metaDesc} onChange={(e) => setSeo((p) => ({ ...p, metaDesc: e.target.value }))} rows={3} className={cn(inp, "!h-auto py-2 resize-none")} /></div>
              <div><label className={lbl}>OG Image URL</label><input value={seo.ogImage} onChange={(e) => setSeo((p) => ({ ...p, ogImage: e.target.value }))} className={inp} /></div>
              <div><label className={lbl}>Google Analytics ID</label><input value={seo.googleAnalytics} onChange={(e) => setSeo((p) => ({ ...p, googleAnalytics: e.target.value }))} placeholder="G-XXXXXXXXXX" className={cn(inp, "font-mono")} /></div>
              <div><label className={lbl}>Meta / Facebook Pixel ID</label><input value={seo.facebookPixel} onChange={(e) => setSeo((p) => ({ ...p, facebookPixel: e.target.value }))} placeholder="Your numeric Pixel ID" inputMode="numeric" className={cn(inp, "font-mono")} /><p className="mt-2 text-xs text-[#6f8da1]">ID দিয়ে Save Changes করুন। এরপর storefront reload করলে PageView, ViewContent, AddToCart, InitiateCheckout ও successful order-এর Purchase tracking চালু হবে।</p></div>
            </div>
          )}

          {tab === "security" && (
            <div className="space-y-4">
              <h2 className="mb-5 font-serif text-2xl font-bold text-[#175a9f]">Security settings</h2>
              <div className="rounded-2xl border border-[#f3dda1] bg-[#fff7d9] p-4 text-[#79580b]">
                <p className="font-semibold text-sm mb-1">Admin Credentials</p>
                <p className="text-xs text-[#8b6d28]">Change your admin email and password below. Make sure to use a strong password.</p>
              </div>
              <div><label className={lbl}>Admin Email</label><input type="email" defaultValue="suppergirl230@gmail.com" className={inp} /></div>
              <div><label className={lbl}>Current Password</label><input type="password" placeholder="••••••••" className={inp} /></div>
              <div><label className={lbl}>New Password</label><input type="password" placeholder="Min 8 characters" className={inp} /></div>
              <div><label className={lbl}>Confirm New Password</label><input type="password" placeholder="Repeat new password" className={inp} /></div>
              <div className="border-t border-[#e4eff6] pt-4">
                <p className={lbl}>Security Features</p>
                {[["Two-Factor Authentication", "Add extra security to your admin account"], ["Login Attempt Limit", "Lock account after 5 failed attempts"]].map(([label, desc]) => (
                  <label key={label} className="mb-2 flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-[#d8e8f2] bg-[#f8fcff] p-3 transition-colors hover:border-[#8cc9ed]">
                    <div><p className="text-sm font-medium">{label}</p><p className="text-xs text-[#7895aa]">{desc}</p></div>
                    <input type="checkbox" defaultChecked className="mt-0.5 h-4 w-4 accent-[#f06a9f]" />
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
