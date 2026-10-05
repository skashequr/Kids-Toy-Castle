"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "../db/connect";
import { requireAdmin } from "../guard";
import { Order } from "../models/Order";
import { mapSteadfastStatus } from "@/lib/steadfast-status";
import type { OrderStatus } from "@/types";
import {
  createSteadfastOrder,
  createSteadfastReturnRequest,
  checkCourierFraud,
  getSteadfastBalance,
  getSteadfastPayment,
  getSteadfastPayments,
  getSteadfastPoliceStations,
  getSteadfastReturnRequests,
  getSteadfastStatusByConsignmentId,
  getSteadfastStatusByInvoice,
  getSteadfastStatusByTrackingCode,
  type FraudCheckResult,
  type SteadfastDistrict,
  type SteadfastPayment,
  type SteadfastReturnRequest,
} from "../services/steadfast";

type ActionResult<T = Record<string, never>> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

function errorMessage(error: unknown) {
  if (error instanceof Error) {
    if (error.name === "TimeoutError") return "Steadfast did not respond in time. Please retry.";
    return error.message;
  }
  return "Could not connect to Steadfast.";
}

function normalizeBangladeshPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 13 && digits.startsWith("880")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("01")) return digits;
  return null;
}

export async function refreshSteadfastBalance(): Promise<
  ActionResult<{ balance: number }>
> {
  try {
    await requireAdmin();
    const result = await getSteadfastBalance();
    const balance = Number(result.current_balance);
    if (!Number.isFinite(balance)) throw new Error("Steadfast returned an invalid balance.");
    return { ok: true, balance };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

export type SteadfastOverview = {
  balance: number | null;
  returns: SteadfastReturnRequest[];
  payments: SteadfastPayment[];
  districts: SteadfastDistrict[];
  fetchedAt: string;
  errors: string[];
};

export async function refreshSteadfastOverview(): Promise<ActionResult<{ data: SteadfastOverview }>> {
  try {
    await requireAdmin();
    const [balance, returns, payments, stations] = await Promise.allSettled([
      getSteadfastBalance(),
      getSteadfastReturnRequests(),
      getSteadfastPayments(),
      getSteadfastPoliceStations(),
    ]);
    const errors: string[] = [];
    for (const [index, result] of [balance, returns, payments, stations].entries()) {
      if (result.status === "rejected") errors.push(`${["Balance", "Returns", "Payments", "Police stations"][index]}: ${errorMessage(result.reason)}`);
    }
    if (balance.status === "fulfilled" && !Number.isFinite(Number(balance.value.current_balance))) {
      errors.push("Balance: Steadfast returned an invalid balance.");
    }
    return {
      ok: true,
      data: {
        balance: balance.status === "fulfilled" && Number.isFinite(Number(balance.value.current_balance)) ? Number(balance.value.current_balance) : null,
        returns: returns.status === "fulfilled" && Array.isArray(returns.value.data) ? returns.value.data : [],
        payments: payments.status === "fulfilled" && Array.isArray(payments.value.payments) ? payments.value.payments : [],
        districts: stations.status === "fulfilled" && Array.isArray(stations.value.data) ? stations.value.data : [],
        fetchedAt: new Date().toISOString(),
        errors,
      },
    };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

export async function lookupSteadfastStatus(
  kind: "invoice" | "tracking" | "consignment",
  rawValue: string
): Promise<ActionResult<{ deliveryStatus: string }>> {
  try {
    await requireAdmin();
    const value = rawValue.trim();
    if (!["invoice", "tracking", "consignment"].includes(kind)) return { ok: false, error: "Invalid lookup type." };
    if (!value) return { ok: false, error: "Enter a lookup value." };
    if (kind === "consignment" && (!Number.isInteger(Number(value)) || Number(value) < 1)) {
      return { ok: false, error: "Enter a valid consignment ID." };
    }
    const result = kind === "invoice"
      ? await getSteadfastStatusByInvoice(value)
      : kind === "tracking"
        ? await getSteadfastStatusByTrackingCode(value)
        : await getSteadfastStatusByConsignmentId(Number(value));
    return { ok: true, deliveryStatus: result.delivery_status };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

export async function requestSteadfastReturn(
  orderId: string,
  reason: string
): Promise<ActionResult<{ request: SteadfastReturnRequest }>> {
  try {
    await requireAdmin();
    if (!/^[a-f0-9]{24}$/i.test(orderId)) return { ok: false, error: "Invalid order ID." };
    await connectDB();
    const order = await Order.findById(orderId)
      .select("orderNumber courier trackingNumber courierConsignmentId")
      .lean();
    if (!order) return { ok: false, error: "Order no longer exists." };
    if (order.courier?.toLowerCase() !== "steadfast" || !order.trackingNumber) {
      return { ok: false, error: "Book this order with Steadfast first." };
    }
    const request = await createSteadfastReturnRequest({
      ...(order.courierConsignmentId
        ? { consignment_id: order.courierConsignmentId }
        : { tracking_code: order.trackingNumber }),
      reason: reason.trim().slice(0, 500) || undefined,
    });
    await Order.updateOne(
      { _id: orderId },
      { $set: { courierReturnRequestId: request.id, courierReturnStatus: request.status } }
    );
    revalidatePath("/admin/delivery");
    return { ok: true, request };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

export async function loadSteadfastPaymentDetails(
  paymentId: number
): Promise<ActionResult<{ payment: Record<string, unknown> }>> {
  try {
    await requireAdmin();
    if (!Number.isInteger(paymentId) || paymentId < 1) return { ok: false, error: "Invalid payment ID." };
    return { ok: true, payment: await getSteadfastPayment(paymentId) };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

export async function runCourierFraudCheck(
  rawPhone: string
): Promise<ActionResult<{ result: FraudCheckResult }>> {
  try {
    await requireAdmin();
    const phone = normalizeBangladeshPhone(rawPhone);
    if (!phone) return { ok: false, error: "Enter a valid 11-digit Bangladesh phone number." };
    return { ok: true, result: await checkCourierFraud(phone) };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

export async function sendOrderToSteadfast(
  orderId: string
): Promise<ActionResult<{ trackingCode: string; consignmentId: number; deliveryStatus: string }>> {
  try {
    await requireAdmin();
    if (!/^[a-f0-9]{24}$/i.test(orderId)) return { ok: false, error: "Invalid order ID." };
    await connectDB();
    const order = await Order.findById(orderId).lean();
    if (!order) return { ok: false, error: "Order no longer exists." };
    if (order.courier?.toLowerCase() === "steadfast" && order.trackingNumber) {
      return { ok: false, error: "This order is already booked with Steadfast." };
    }
    if (["delivered", "cancelled", "returned"].includes(order.status)) {
      return { ok: false, error: "Completed, cancelled or returned orders cannot be booked." };
    }
    if (order.trackingNumber) return { ok: false, error: "This order already has a courier booking." };
    if (!order.shippingAddress.fullName.trim() || !Number.isFinite(order.total) || order.total < 0) {
      return { ok: false, error: "Customer name or order total is invalid." };
    }

    const phone = normalizeBangladeshPhone(order.shippingAddress.phone);
    if (!phone) return { ok: false, error: "Customer phone must be a valid 11-digit Bangladesh number." };
    const address = [
      order.shippingAddress.address,
      order.shippingAddress.area,
      order.shippingAddress.city,
      order.shippingAddress.district,
      order.shippingAddress.postalCode,
    ].filter(Boolean).join(", ").trim();
    if (!address) return { ok: false, error: "Customer delivery address is missing." };
    if (address.length > 250) return { ok: false, error: "Delivery address must be 250 characters or fewer." };

    const itemDescription = order.items
      .map((item) => `${item.name} × ${item.quantity}`)
      .join(", ")
      .slice(0, 250);
    const totalLot = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const result = await createSteadfastOrder({
      invoice: order.orderNumber,
      recipient_name: order.shippingAddress.fullName.slice(0, 100),
      recipient_phone: phone,
      recipient_address: address,
      recipient_email: order.shippingAddress.email || undefined,
      cod_amount: order.paymentStatus === "paid" ? 0 : Math.max(0, order.total),
      note: order.orderNotes?.slice(0, 250) || undefined,
      item_description: itemDescription || undefined,
      total_lot: totalLot || 1,
      delivery_type: 0,
    });

    const trackingCode = result.consignment?.tracking_code;
    if (!trackingCode) throw new Error(result.message || "Steadfast did not return a tracking code.");
    await Order.updateOne(
      { _id: orderId },
      {
        $set: {
          courier: "Steadfast",
          trackingNumber: trackingCode,
          courierConsignmentId: result.consignment.consignment_id,
          courierStatus: result.consignment.status || "in_review",
          status: order.status === "pending" ? "processing" : order.status,
        },
      }
    );
    revalidatePath("/admin/delivery");
    revalidatePath("/admin/orders");
    return {
      ok: true,
      trackingCode,
      consignmentId: result.consignment.consignment_id,
      deliveryStatus: result.consignment.status || "in_review",
    };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

export async function syncSteadfastOrderStatus(
  orderId: string
): Promise<ActionResult<SteadfastOrderUpdate>> {
  try {
    await requireAdmin();
    if (!/^[a-f0-9]{24}$/i.test(orderId)) return { ok: false, error: "Invalid order ID." };
    const update = await syncOrderFromSteadfast(orderId);
    for (const path of ["/admin/delivery", "/admin/orders", "/admin/finance", "/admin"]) revalidatePath(path);
    return { ok: true, ...update };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

export type SteadfastOrderUpdate = {
  id: string;
  deliveryStatus: string;
  orderStatus: string;
  courierTrackingMessage: string;
  courierUpdatedAt?: string;
  courierStatusUpdatedAt?: string;
  courierDeliveryCharge?: number;
};

async function syncOrderFromSteadfast(orderId: string): Promise<SteadfastOrderUpdate> {
  await connectDB();
  const order = await Order.findById(orderId).lean();
  if (!order) throw new Error("Order no longer exists.");
  if (order.courier?.toLowerCase() !== "steadfast" || !order.trackingNumber) {
    throw new Error("Book this order with Steadfast first.");
  }
  const checkedAt = new Date();
  const result = await getSteadfastStatusByTrackingCode(order.trackingNumber);
  const orderStatus = mapSteadfastStatus(result.delivery_status, order.status as OrderStatus);
  const update: Record<string, unknown> = {
    courierStatus: result.delivery_status,
    courierStatusUpdatedAt: checkedAt,
    status: orderStatus,
    ...(orderStatus === "delivered" && !order.deliveredAt ? { deliveredAt: checkedAt } : {}),
  };
  // A status-only response must never erase a tracking note received by webhook.
  if (result.tracking_message !== undefined) {
    update.courierTrackingMessage = result.tracking_message;
    update.courierUpdatedAt = checkedAt;
  }
  if (result.delivery_charge !== undefined) update.courierDeliveryCharge = result.delivery_charge;
  await Order.updateOne({
    _id: orderId,
    status: order.status,
    trackingNumber: order.trackingNumber,
    courierStatusUpdatedAt: order.courierStatusUpdatedAt ?? { $exists: false },
    ...(result.tracking_message !== undefined ? { courierUpdatedAt: order.courierUpdatedAt ?? { $exists: false } } : {}),
  }, { $set: update });
  // Read the authoritative row again: a newer webhook may have won the race.
  const saved = await Order.findById(orderId).lean();
  if (!saved) throw new Error("Order no longer exists.");
  return {
    id: orderId,
    deliveryStatus: saved.courierStatus ?? "",
    orderStatus: saved.status,
    courierTrackingMessage: saved.courierTrackingMessage ?? "",
    courierUpdatedAt: saved.courierUpdatedAt?.toISOString(),
    courierStatusUpdatedAt: saved.courierStatusUpdatedAt?.toISOString(),
    courierDeliveryCharge: saved.courierDeliveryCharge ?? undefined,
  };
}

export async function syncSteadfastDeliveryOrders(orderIds: string[]): Promise<ActionResult<{
  updates: SteadfastOrderUpdate[];
  errors: string[];
}>> {
  try {
    await requireAdmin();
    if (!Array.isArray(orderIds) || orderIds.length > 50 || orderIds.some((id) => typeof id !== "string" || !/^[a-f0-9]{24}$/i.test(id))) {
      return { ok: false, error: "Use at most 50 valid order IDs per sync." };
    }
    const ids = [...new Set(orderIds)];
    const updates: SteadfastOrderUpdate[] = [];
    const errors: string[] = [];
    for (let offset = 0; offset < ids.length; offset += 5) {
      const results = await Promise.allSettled(ids.slice(offset, offset + 5).map(syncOrderFromSteadfast));
      for (const result of results) {
        if (result.status === "fulfilled") updates.push(result.value);
        else errors.push(errorMessage(result.reason));
      }
    }
    if (updates.length) {
      for (const path of ["/admin/delivery", "/admin/orders", "/admin/finance", "/admin"]) revalidatePath(path);
    }
    return { ok: true, updates, errors };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}
