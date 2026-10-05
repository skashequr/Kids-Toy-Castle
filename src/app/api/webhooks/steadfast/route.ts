import { timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { connectDB } from "@/server/db/connect";
import { Order } from "@/server/models/Order";
import { mapSteadfastStatus, normalizeSteadfastStatus } from "@/lib/steadfast-status";
import type { OrderStatus } from "@/types";

export const runtime = "nodejs";

const payloadSchema = z.object({
  notification_type: z.enum(["delivery_status", "tracking_update"]),
  consignment_id: z.number().int().positive().optional(),
  invoice: z.string().trim().min(1).max(100).optional(),
  status: z.string().max(100).optional(),
  delivery_charge: z.number().finite().nonnegative().optional(),
  cod_amount: z.number().finite().nonnegative().optional(),
  tracking_message: z.string().max(1000).optional(),
  updated_at: z.string().max(100).optional(),
}).refine((body) => body.invoice || body.consignment_id, "Missing identifier.")
  .refine((body) => body.notification_type !== "tracking_update" || body.tracking_message !== undefined, "Missing tracking message.");

function authorized(request: Request) {
  const expected = (process.env.STEADFAST_WEBHOOK_SECRET || process.env.STEADFAST_API_KEY)?.trim();
  const header = request.headers.get("authorization") ?? "";
  if (!/^Bearer\s+/i.test(header)) return false;
  const received = header.replace(/^Bearer\s+/i, "").trim();
  if (!expected || !received) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(received);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!authorized(request)) return Response.json({ error: "Unauthorized." }, { status: 401 });
  const parsed = payloadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid webhook payload." }, { status: 400 });
  const body = parsed.data;
  const status = body.status ? normalizeSteadfastStatus(body.status) : null;
  if (body.notification_type === "delivery_status" && !status) {
    return Response.json({ error: "Invalid delivery status." }, { status: 400 });
  }
  // Zone-less provider timestamps use Bangladesh local time.
  const stamp = body.updated_at?.trim();
  const normalizedStamp = stamp && /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}$/.test(stamp)
    ? `${stamp.replace(" ", "T")}+06:00` : stamp;
  const eventAt = normalizedStamp ? new Date(normalizedStamp) : new Date();
  if (Number.isNaN(eventAt.getTime())) return Response.json({ error: "Invalid update timestamp." }, { status: 400 });

  try {
    await connectDB();
    const order = await Order.findOne({
      courier: /^steadfast$/i,
      ...(body.invoice ? { orderNumber: body.invoice } : {}),
      ...(body.consignment_id ? { courierConsignmentId: body.consignment_id } : {}),
    }).lean();
    if (!order) return Response.json({ status: "success", ignored: true });
    const isStatus = body.notification_type === "delivery_status";
    const clock = isStatus ? "courierStatusUpdatedAt" : "courierUpdatedAt";
    const update: Record<string, unknown> = { [clock]: eventAt };
    if (isStatus && status) {
      const mapped = mapSteadfastStatus(status, order.status as OrderStatus);
      update.courierStatus = status;
      update.status = mapped;
      if (mapped === "delivered" && !order.deliveredAt) update.deliveredAt = eventAt;
      if (body.delivery_charge !== undefined) update.courierDeliveryCharge = body.delivery_charge;
      if (body.cod_amount !== undefined) update.courierCodAmount = body.cod_amount;
    }
    if (!isStatus && body.tracking_message !== undefined) update.courierTrackingMessage = body.tracking_message;
    await Order.updateOne({
      _id: order._id,
      status: order.status,
      $or: [{ [clock]: { $exists: false } }, { [clock]: { $lt: eventAt } }],
    }, {
      $set: update,
      ...(!isStatus || body.tracking_message === undefined ? { $push: { courierTrackingHistory: {
        $each: [{ message: body.tracking_message ?? "", ...(isStatus && status ? { status } : {}), updatedAt: eventAt }],
        $slice: -100,
      } } } : {}),
    });
    // Status polling and tracking messages have independent clocks. A delayed
    // status callback can still carry a new rider note and must not lose it.
    if (isStatus && body.tracking_message !== undefined) {
      await Order.updateOne({
        _id: order._id,
        $or: [{ courierUpdatedAt: { $exists: false } }, { courierUpdatedAt: { $lt: eventAt } }],
      }, {
        $set: { courierTrackingMessage: body.tracking_message, courierUpdatedAt: eventAt },
        $push: { courierTrackingHistory: {
          $each: [{ message: body.tracking_message, status: status ?? undefined, updatedAt: eventAt }],
          $slice: -100,
        } },
      });
    }
    for (const path of ["/admin/delivery", "/admin/orders", "/admin/finance", "/admin"]) revalidatePath(path);
    return Response.json({ status: "success" });
  } catch {
    return Response.json({ error: "Could not process webhook. Please retry." }, { status: 503 });
  }
}
