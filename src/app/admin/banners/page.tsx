import { AdminBannersClient, type AdminBannerRow } from "@/components/admin/banners-client";
import { getBanners } from "@/server/services/banners";

export const metadata = { title: "Banners | Luxen Admin" };

export default async function AdminBannersPage() {
  const banners = await getBanners();
  const rows: AdminBannerRow[] = banners.map((b) => ({
    id: b.id,
    title: b.title,
    subtitle: b.subtitle,
    image: b.image,
    link: b.link,
    position: (b.position as AdminBannerRow["position"]) ?? "hero",
    active: b.isActive,
    order: b.displayOrder,
  }));
  return <AdminBannersClient key={JSON.stringify(rows)} initial={rows} />;
}
