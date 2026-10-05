import type { OrderStatus } from "@/types";

export const STEADFAST_STATUSES = [
  "pending", "in_review", "hold", "unknown", "delivered",
  "partial_delivered", "cancelled", "delivered_approval_pending",
  "partial_delivered_approval_pending", "cancelled_approval_pending",
  "unknown_approval_pending",
] as const;

export function normalizeSteadfastStatus(value: string) {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, "_");
  return STEADFAST_STATUSES.find((status) => status === normalized) ?? null;
}

// Partial delivery does not mean the entire order was returned. Approval-pending,
// hold and unknown statuses must not downgrade a shipped or completed order.
export function mapSteadfastStatus(value: string, current: OrderStatus): OrderStatus {
  const status = normalizeSteadfastStatus(value);
  if (status === "delivered") return "delivered";
  if (status === "cancelled") return "cancelled";
  if (["pending", "in_review"].includes(status ?? "") && ["pending", "confirmed"].includes(current)) {
    return "processing";
  }
  return current;
}
