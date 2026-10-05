"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "../db/connect";
import { Banner } from "../models/Banner";
import { requireAdmin } from "../guard";

export type BannerPosition = "hero" | "homepage-mid" | "category" | "sidebar" | "popup";

export type BannerInput = {
  title: string;
  subtitle?: string;
  image: string;
  link?: string;
  position?: BannerPosition;
  isActive?: boolean;
  displayOrder?: number;
};

const POSITIONS = new Set<BannerPosition>(["hero", "homepage-mid", "category", "sidebar", "popup"]);

function cleanInput(input: BannerInput) {
  const title = input.title.trim();
  const image = input.image.trim();
  const position: BannerPosition = input.position ?? "hero";
  if (!title) throw new Error("Banner title is required.");
  if (!image) throw new Error("Banner image is required.");
  if (!POSITIONS.has(position)) throw new Error("Invalid banner position.");
  const link = input.link?.trim() || "/";
  if (!link.startsWith("/") && !/^https?:\/\//i.test(link)) {
    throw new Error("Banner link must be a site path or an http(s) URL.");
  }

  return {
    title,
    subtitle: input.subtitle?.trim() ?? "",
    image,
    link,
    position,
    isActive: input.isActive ?? true,
    displayOrder: Math.max(1, Math.trunc(input.displayOrder ?? 1)),
  };
}

export async function createBanner(input: BannerInput) {
  await requireAdmin();
  await connectDB();
  await Banner.create(cleanInput(input));
  revalidatePath("/admin/banners");
  revalidatePath("/");
  return { ok: true };
}

export async function updateBanner(id: string, input: Partial<BannerInput>) {
  await requireAdmin();
  await connectDB();
  const current = await Banner.findById(id).lean();
  if (!current) throw new Error("Banner not found.");
  const merged: BannerInput = {
    title: input.title ?? current.title,
    subtitle: input.subtitle ?? current.subtitle ?? undefined,
    image: input.image ?? current.image,
    link: input.link ?? current.link ?? undefined,
    position: input.position ?? current.position,
    isActive: input.isActive ?? current.isActive,
    displayOrder: input.displayOrder ?? current.displayOrder,
  };
  await Banner.findByIdAndUpdate(id, cleanInput(merged), { runValidators: true });
  revalidatePath("/admin/banners");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteBanner(id: string) {
  await requireAdmin();
  await connectDB();
  await Banner.findByIdAndDelete(id);
  revalidatePath("/admin/banners");
  revalidatePath("/");
  return { ok: true };
}

export async function toggleBanner(id: string, isActive: boolean) {
  await requireAdmin();
  await connectDB();
  await Banner.findByIdAndUpdate(id, { isActive });
  revalidatePath("/admin/banners");
  revalidatePath("/");
  return { ok: true };
}
