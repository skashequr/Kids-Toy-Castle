import "server-only";
import { z } from "zod";
import { normalizeSteadfastStatus } from "@/lib/steadfast-status";

const STEADFAST_BASE_URL = "https://portal.packzy.com/api/v1";

export type SteadfastDeliveryStatus =
  | "pending"
  | "delivered_approval_pending"
  | "partial_delivered_approval_pending"
  | "cancelled_approval_pending"
  | "unknown_approval_pending"
  | "delivered"
  | "partial_delivered"
  | "cancelled"
  | "hold"
  | "in_review"
  | "unknown";

export type SteadfastCreateOrderInput = {
  invoice: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  cod_amount: number;
  recipient_email?: string;
  note?: string;
  item_description?: string;
  total_lot?: number;
  delivery_type?: 0 | 1;
};

type SteadfastErrorBody = {
  message?: string;
  errors?: Record<string, string[] | string>;
};

export type SteadfastOrderResponse = {
  status: number;
  message?: string;
  consignment: {
    consignment_id: number;
    invoice: string;
    tracking_code: string;
    recipient_name: string;
    recipient_phone: string;
    recipient_address: string;
    cod_amount: number;
    status: string;
  };
};

export type SteadfastReturnRequest = {
  id: number;
  user_id?: number;
  consignment_id: number;
  reason?: string | null;
  status: "pending" | "approved" | "processing" | "completed" | "cancelled" | string;
  created_at?: string;
  updated_at?: string;
  consignment?: {
    invoice?: string;
    tracking_code?: string;
    tracking_link?: string;
    recipient_name?: string;
    recipient_phone?: string;
    recipient_address?: string;
    cod_amount?: number | string;
    status?: string;
  };
};

export type SteadfastPayment = {
  payment_id: number;
  amount?: number | string;
  method?: string;
  due_bills?: number | string;
  paid_bills?: number | string;
  charges?: number | string;
  total?: number | string;
  status_label?: string;
  created_at?: string;
  ready_at?: string | null;
  paid_at?: string | null;
};

export type SteadfastPoliceStation = {
  id: number;
  name: string;
  hub_id?: number;
  district_id?: number;
  post_code?: string | null;
  address?: string | null;
  phone?: string | null;
};

export type SteadfastDistrict = {
  id: number;
  name: string;
  policestations: SteadfastPoliceStation[];
};

export type FraudCheckResult = {
  phone: string;
  total_orders: number;
  total_delivered: number;
  total_cancelled: number;
  delivery_rate: string;
  steadfast_configured?: boolean;
  couriers: Array<{
    courier_name: string;
    orders: number;
    delivered: number;
    cancelled: number;
    delivery_rate: string;
    customer_rating?: string;
    source?: string;
    data_type?: string;
  }>;
};

function credentials() {
  const apiKey = process.env.STEADFAST_API_KEY?.trim();
  const secretKey = process.env.STEADFAST_SECRET_KEY?.trim();
  if (!apiKey || !secretKey) {
    throw new Error("Steadfast API credentials are not configured.");
  }
  return { apiKey, secretKey };
}

async function steadfastFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const { apiKey, secretKey } = credentials();
  const response = await fetch(`${STEADFAST_BASE_URL}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "Api-Key": apiKey,
      "Secret-Key": secretKey,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    signal: AbortSignal.timeout(15_000),
  });

  const body = (await response.json().catch(() => null)) as T | SteadfastErrorBody | null;
  const details = body as (SteadfastErrorBody & { status?: unknown }) | null;
  if (!response.ok || (typeof details?.status === "number" && details.status >= 400)) {
    const fieldError = details?.errors
      ? Object.values(details.errors).flat().filter(Boolean)[0]
      : undefined;
    throw new Error(fieldError || details?.message || `Steadfast request failed (${response.status}).`);
  }
  if (!body) throw new Error("Steadfast returned an empty response.");
  return body as T;
}

export async function getSteadfastBalance() {
  return steadfastFetch<{ status: number; current_balance: number }>("/get_balance");
}

export async function createSteadfastOrder(input: SteadfastCreateOrderInput) {
  return steadfastFetch<SteadfastOrderResponse>("/create_order", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getSteadfastStatusByInvoice(invoice: string) {
  return fetchStatus(
    `/status_by_invoice/${encodeURIComponent(invoice)}`
  );
}

export async function getSteadfastStatusByConsignmentId(id: number) {
  return fetchStatus(
    `/status_by_cid/${id}`
  );
}

export async function getSteadfastStatusByTrackingCode(trackingCode: string) {
  return fetchStatus(
    `/status_by_trackingcode/${encodeURIComponent(trackingCode)}`
  );
}

async function fetchStatus(path: string) {
  const result = await steadfastFetch<{ status: number; delivery_status?: unknown; tracking_message?: unknown; delivery_charge?: unknown }>(path);
  const status = typeof result.delivery_status === "string"
    ? normalizeSteadfastStatus(result.delivery_status) : null;
  if (!status) throw new Error("Steadfast returned an invalid delivery status.");
  return {
    status: result.status,
    delivery_status: status,
    ...(typeof result.tracking_message === "string" ? { tracking_message: result.tracking_message.slice(0, 1000) } : {}),
    ...(typeof result.delivery_charge === "number" && Number.isFinite(result.delivery_charge) && result.delivery_charge >= 0 ? { delivery_charge: result.delivery_charge } : {}),
  };
}

export async function createSteadfastReturnRequest(input: {
  consignment_id?: number;
  invoice?: string;
  tracking_code?: string;
  reason?: string;
}) {
  return steadfastFetch<SteadfastReturnRequest>("/create_return_request", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getSteadfastReturnRequest(id: number) {
  return steadfastFetch<SteadfastReturnRequest>(`/get_return_request/${id}`);
}

export async function getSteadfastReturnRequests() {
  const first = await steadfastFetch<{
    data: SteadfastReturnRequest[];
    links?: Record<string, unknown>;
    meta?: { current_page?: number; last_page?: number } & Record<string, unknown>;
  }>("/get_return_requests");
  const lastPage = Math.min(Math.max(Number(first.meta?.last_page) || 1, 1), 100);
  if (lastPage === 1) return first;
  const remaining = await Promise.all(
    Array.from({ length: lastPage - 1 }, (_, index) =>
      steadfastFetch<{ data: SteadfastReturnRequest[] }>(`/get_return_requests?page=${index + 2}`)
    )
  );
  return { ...first, data: [...first.data, ...remaining.flatMap((page) => page.data ?? [])] };
}

export async function getSteadfastPayments() {
  return steadfastFetch<{
    status?: number;
    message?: string;
    payments: SteadfastPayment[];
  }>("/payments");
}

export async function getSteadfastPayment(id: number) {
  return steadfastFetch<Record<string, unknown>>(`/payments/${id}`);
}

export async function getSteadfastPoliceStations() {
  return steadfastFetch<{ status?: number; data: SteadfastDistrict[] }>("/police_stations");
}

export async function checkCourierFraud(phone: string) {
  let response: Response;
  try {
    response = await fetch("https://elitemart.com.bd/fraud-check/lookup", {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ phone }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    throw new Error(error instanceof Error && error.name === "TimeoutError"
      ? "Courier fraud checker did not respond in time. Please retry."
      : "Could not connect to the courier fraud checker. Please retry.");
  }
  const body = (await response.json().catch(() => null)) as
    | { success?: boolean; data?: unknown; message?: unknown; error?: unknown }
    | null;
  if (response.status === 401 || response.status === 403) {
    throw new Error(`Elite Mart blocked this server's fraud lookup (${response.status}). Please retry later or ask the provider to approve server access. Steadfast API keys do not grant access to this separate service.`);
  }
  if (response.status === 429) {
    throw new Error("Courier fraud checker request limit reached. Please wait before trying again.");
  }
  if (!response.ok || body?.success !== true) {
    const message = typeof body?.error === "string" ? body.error : body?.message;
    throw new Error(typeof message === "string" && message.trim()
      ? message.slice(0, 300)
      : `Courier fraud checker is unavailable (${response.status}). Please retry later.`);
  }
  const count = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
  const rate = z.string().max(40);
  const result = z.object({
    phone: z.literal(phone),
    total_orders: count,
    total_delivered: count,
    total_cancelled: count,
    delivery_rate: rate,
    steadfast_configured: z.boolean().optional(),
    couriers: z.array(z.object({
      courier_name: z.string().min(1).max(100),
      orders: count,
      delivered: count,
      cancelled: count,
      delivery_rate: rate,
      customer_rating: z.string().max(100).optional(),
      source: z.string().max(150).optional(),
      data_type: z.string().max(50).optional(),
    })).max(30),
  }).safeParse(body.data);
  if (!result.success) throw new Error("Courier fraud checker returned an incomplete or invalid report. Please retry later.");
  return result.data;
}
