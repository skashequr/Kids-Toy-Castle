import { AdminCouponsClient, type AdminCouponRow } from "@/components/admin/coupons-client";
import { getCoupons } from "@/server/services/coupons";

export const metadata = { title: "Coupons | Luxen Admin" };

export default async function AdminCouponsPage() {
  const coupons = await getCoupons();
  const rows: AdminCouponRow[] = coupons.map((c) => ({
    id: c.id,
    code: c.code,
    type: (c.type as AdminCouponRow["type"]) ?? "percentage",
    value: c.value,
    minOrder: c.minPurchase ?? 0,
    maxUses: c.usageLimit ?? 0,
    used: c.usedCount,
    validFrom: "",
    validUntil: c.expiresAt ?? "",
    active: c.isActive,
    description: c.description,
  }));
  return <AdminCouponsClient initial={rows} />;
}
