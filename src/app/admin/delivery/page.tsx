import { AdminDeliveryClient, type DeliveryOrderRow } from "@/components/admin/delivery-client";
import { SteadfastDataClient } from "@/components/admin/steadfast-data-client";
import { refreshSteadfastOverview } from "@/server/actions/steadfast";
import { getOrders } from "@/server/services/orders";
import { requireAdmin } from "@/server/guard";

export const metadata = { title: "Delivery | Kids Toy Castle Admin" };

export default async function AdminDeliveryPage() {
  await requireAdmin();
  const [orders, overviewResult] = await Promise.all([
    getOrders(),
    refreshSteadfastOverview(),
  ]);
  const rows: DeliveryOrderRow[] = orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    customer: order.shippingAddress.fullName,
    phone: order.shippingAddress.phone,
    address: [order.shippingAddress.address, order.shippingAddress.area, order.shippingAddress.city, order.shippingAddress.district]
      .filter(Boolean)
      .join(", "),
    items: order.items.reduce((sum, item) => sum + item.quantity, 0),
    total: order.total,
    status: order.status,
    date: order.createdAt,
    courier: order.courier ?? "",
    trackingNumber: order.trackingNumber ?? "",
    courierStatus: order.courierStatus ?? "",
    courierTrackingMessage: order.courierTrackingMessage ?? "",
    courierTrackingHistory: order.courierTrackingHistory,
    courierUpdatedAt: order.courierUpdatedAt,
    courierStatusUpdatedAt: order.courierStatusUpdatedAt,
    courierDeliveryCharge: order.courierDeliveryCharge,
    courierCodAmount: order.courierCodAmount,
    courierConsignmentId: order.courierConsignmentId,
    estimatedDelivery: order.estimatedDelivery,
    notes: order.notes ?? "",
  }));
  return <>
    <AdminDeliveryClient
      initialOrders={rows}
      initialSteadfastBalance={overviewResult.ok ? overviewResult.data.balance : null}
      initialSteadfastError={overviewResult.ok ? overviewResult.data.errors.find((error) => error.startsWith("Balance:")) ?? "" : overviewResult.error}
    />
    <details className="mx-auto mt-6 max-w-7xl rounded-2xl border border-slate-200 bg-white p-4">
      <summary className="cursor-pointer text-sm font-semibold text-slate-700">Steadfast account & tools · Returns, payments, coverage, fraud lookup</summary>
    <SteadfastDataClient
      initialData={overviewResult.ok ? overviewResult.data : null}
      initialError={overviewResult.ok ? overviewResult.data.errors.join(" · ") : overviewResult.error}
      bookedOrders={rows
        .filter((order) => order.courier.toLowerCase() === "steadfast" && order.trackingNumber)
        .map((order) => ({ id: order.id, orderNumber: order.orderNumber, customer: order.customer }))}
    />
    </details>
  </>;
}
