import { AdminOrdersClient, type AdminOrderRow } from "@/components/admin/orders-client";
import { getOrders } from "@/server/services/orders";
import { orderPresetRange } from "@/lib/order-date-range";
import type { OrderStatus } from "@/types";

export const metadata = { title: "Orders | Kids Toy Castle Admin" };

export default async function AdminOrdersPage() {
  const orders = await getOrders();
  const rows: AdminOrderRow[] = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customer: o.shippingAddress.fullName,
    phone: o.shippingAddress.phone,
    address: [o.shippingAddress.address, o.shippingAddress.area, o.shippingAddress.city, o.shippingAddress.district]
      .filter(Boolean)
      .join(", "),
    lineItems: o.items.map((item) => ({ name: item.product.name, image: item.product.images[0]?.url, variantLabel: item.variantLabel, variantSku: item.variantSku, quantity: item.quantity, price: item.price })),
    items: o.items.reduce((sum, it) => sum + it.quantity, 0),
    total: o.total,
    subtotal: o.subtotal, discount: o.discount, shipping: o.shipping,
    email: o.user.email, paymentStatus: o.paymentStatus,
    status: o.status as OrderStatus,
    date: o.createdAt,
    courier: o.courier ?? "",
    trackingNumber: o.trackingNumber ?? "",
    paymentMethod: o.paymentMethod,
    notes: o.notes ?? "",
  }));
  return <AdminOrdersClient initialOrders={rows} initialRange={orderPresetRange(30)} />;
}
