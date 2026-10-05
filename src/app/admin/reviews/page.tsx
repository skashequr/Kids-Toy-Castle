import { AdminReviewsClient, type AdminReviewRow } from "@/components/admin/reviews-client";
import { getAllReviewsAdmin } from "@/server/services/reviews";

export const metadata = { title: "Reviews | Luxen Admin" };

export default async function AdminReviewsPage() {
  const reviews = await getAllReviewsAdmin();
  const rows: AdminReviewRow[] = reviews.map((r) => ({
    id: r.id,
    productName: r.productName,
    customerName: r.userName,
    customerEmail: "",
    rating: r.rating,
    comment: r.body,
    date: r.createdAt,
    status: (r.status as AdminReviewRow["status"]) ?? "pending",
  }));
  return <AdminReviewsClient initial={rows} />;
}
