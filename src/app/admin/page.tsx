import { AdminDashboard } from "@/components/admin/dashboard";
import { getDashboardStats } from "@/server/services/dashboard";

export const metadata = { title: "Admin Dashboard | Kids Toy Castle" };

export default async function AdminPage() {
  const stats = await getDashboardStats();
  return <AdminDashboard stats={stats} />;
}
