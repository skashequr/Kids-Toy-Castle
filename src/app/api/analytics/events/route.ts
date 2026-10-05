import { connectDB } from "@/server/db/connect";
import { AnalyticsEvent } from "@/server/models/AnalyticsEvent";

const eventTypes = ["page_view", "product_view", "add_to_cart", "checkout_started"] as const;
type AnalyticsEventType = (typeof eventTypes)[number];

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const type = typeof body.type === "string" ? body.type : "";
    const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
    const path = typeof body.path === "string" ? body.path : "/";
    const productId = typeof body.productId === "string" ? body.productId : undefined;
    const productName = typeof body.productName === "string" ? body.productName : undefined;

    if (!eventTypes.includes(type as AnalyticsEventType) || !sessionId || sessionId.length > 100 || !path.startsWith("/") || path.length > 200) {
      return Response.json({ ok: false }, { status: 400 });
    }

    await connectDB();
    await AnalyticsEvent.create({
      type: type as AnalyticsEventType,
      sessionId,
      path,
      productId: productId?.slice(0, 100),
      productName: productName?.slice(0, 160),
    });
    return Response.json({ ok: true }, { status: 201 });
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }
}
