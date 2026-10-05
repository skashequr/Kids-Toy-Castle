import { connectDB } from "../db/connect";
import { Settings } from "../models/Settings";
import { cache } from "react";
import { normalizeStoreInformation } from "@/lib/store-information";

export type StoreSettings = {
  store: Record<string, unknown>;
  shipping: Record<string, unknown>;
  payment: Record<string, unknown>;
  notifications: Record<string, unknown>;
  seo: Record<string, unknown>;
};

export const getSettings = cache(async (): Promise<StoreSettings> => {
  await connectDB();
  const doc = await Settings.findOne({ key: "default" }).lean();
  return {
    store: (doc?.store as Record<string, unknown>) ?? {},
    shipping: (doc?.shipping as Record<string, unknown>) ?? {},
    payment: (doc?.payment as Record<string, unknown>) ?? {},
    notifications: (doc?.notifications as Record<string, unknown>) ?? {},
    seo: (doc?.seo as Record<string, unknown>) ?? {},
  };
});

export const getStoreInformation = cache(async () => {
  try {
    return normalizeStoreInformation((await getSettings()).store);
  } catch (error) {
    console.error("Unable to load store information:", error);
    return normalizeStoreInformation();
  }
});

export type TrackingSettings = {
  googleAnalyticsId: string;
  facebookPixelId: string;
};

export async function getTrackingSettings(): Promise<TrackingSettings> {
  const rawGoogleId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim().toUpperCase() ?? "";
  const rawPixelId = process.env.NEXT_PUBLIC_FB_PIXEL_ID?.trim() ?? "";
  const envGoogleId = /^G-[A-Z0-9]+$/.test(rawGoogleId) ? rawGoogleId : "";
  const envPixelId = /^\d{5,20}$/.test(rawPixelId) ? rawPixelId : "";

  try {
    const settings = await getSettings();
    const storedGoogleId = String(settings.seo.googleAnalytics ?? "").trim().toUpperCase();
    const storedPixelId = String(settings.seo.facebookPixel ?? "").trim();
    return {
      googleAnalyticsId: /^G-[A-Z0-9]+$/.test(storedGoogleId) ? storedGoogleId : envGoogleId,
      facebookPixelId: /^\d{5,20}$/.test(storedPixelId) ? storedPixelId : envPixelId,
    };
  } catch (error) {
    console.error("Unable to load tracking settings:", error);
    return { googleAnalyticsId: envGoogleId, facebookPixelId: envPixelId };
  }
}
