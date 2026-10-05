"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "../db/connect";
import { Settings } from "../models/Settings";
import { requireAdmin } from "../guard";
import { normalizeStoreInformation, safeStoreUrl } from "@/lib/store-information";

export type SettingsInput = {
  store?: Record<string, unknown>;
  shipping?: Record<string, unknown>;
  payment?: Record<string, unknown>;
  notifications?: Record<string, unknown>;
  seo?: Record<string, unknown>;
};

function cleanSeoSettings(seo: Record<string, unknown>) {
  const googleAnalytics = String(seo.googleAnalytics ?? "").trim().toUpperCase();
  const facebookPixel = String(seo.facebookPixel ?? "").trim();
  if (googleAnalytics && !/^G-[A-Z0-9]+$/.test(googleAnalytics)) {
    throw new Error("Use a valid Google Analytics 4 ID, for example G-XXXXXXXXXX.");
  }
  if (facebookPixel && !/^\d{5,20}$/.test(facebookPixel)) {
    throw new Error("Facebook Pixel ID must contain 5–20 digits.");
  }
  return { ...seo, googleAnalytics, facebookPixel };
}

export async function saveSettings(input: SettingsInput) {
  await requireAdmin();
  await connectDB();
  const set: Record<string, unknown> = {};
  if (input.store) {
    if (!String(input.store.storeName ?? "").trim()) throw new Error("Store name is required.");
    for (const key of ["facebook", "instagram", "youtube", "logo", "favicon"] as const) {
      const value = String(input.store[key] ?? "").trim();
      if (value && !safeStoreUrl(value, key === "logo" || key === "favicon")) {
        throw new Error(`${key}: use a valid http/https URL${key === "logo" || key === "favicon" ? " or a local /image path" : ""}.`);
      }
    }
    const email = String(input.store.email ?? "").trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid contact email.");
    set.store = { ...input.store, ...normalizeStoreInformation(input.store) };
  }
  if (input.shipping) set.shipping = input.shipping;
  if (input.payment) set.payment = input.payment;
  if (input.notifications) set.notifications = input.notifications;
  if (input.seo) set.seo = cleanSeoSettings(input.seo);

  await Settings.updateOne(
    { key: "default" },
    { $set: set, $setOnInsert: { key: "default" } },
    { upsert: true }
  );
  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
  return { ok: true };
}
