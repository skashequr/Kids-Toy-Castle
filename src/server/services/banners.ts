import { connectDB } from "../db/connect";
import { Banner } from "../models/Banner";

export type BannerRow = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  link: string;
  position: string;
  isActive: boolean;
  displayOrder: number;
};

function toRow(d: Record<string, unknown>): BannerRow {
  const storedPosition = (d.position as string) ?? "hero";
  return {
    id: String(d._id),
    title: (d.title as string) ?? "",
    subtitle: (d.subtitle as string) ?? "",
    image: (d.image as string) ?? "",
    link: (d.link as string) ?? "",
    position: storedPosition === "home_hero" ? "hero" : storedPosition,
    isActive: (d.isActive as boolean) ?? false,
    displayOrder: (d.displayOrder as number) ?? 0,
  };
}

export async function getBanners(): Promise<BannerRow[]> {
  await connectDB();
  const docs = await Banner.find({}).sort({ displayOrder: 1 }).lean();
  return docs.map((d) => toRow(d as Record<string, unknown>));
}

export async function getActiveBanners(position?: string): Promise<BannerRow[]> {
  await connectDB();
  const query: Record<string, unknown> = { isActive: true };
  if (position === "hero") query.position = { $in: ["hero", "home_hero"] };
  else if (position) query.position = position;
  const docs = await Banner.find(query).sort({ displayOrder: 1 }).lean();
  return docs.map((d) => toRow(d as Record<string, unknown>));
}
