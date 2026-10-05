import { AdminCustomersClient, type AdminCustomerRow } from "@/components/admin/customers-client";
import { getCustomers } from "@/server/services/customers";

export const metadata = { title: "Customers | Luxen Admin" };

export default async function AdminCustomersPage() {
  const customers = await getCustomers();
  const rows: AdminCustomerRow[] = customers.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    city: c.city,
    orders: c.ordersCount,
    totalSpent: c.totalSpent,
    loyaltyPoints: c.loyaltyPoints,
    joinedAt: c.createdAt,
    lastOrder: c.lastOrderAt ?? "",
    status: c.isActive ? "active" : "inactive",
  }));
  return <AdminCustomersClient customers={rows} />;
}
