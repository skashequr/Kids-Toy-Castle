import { requireAdmin } from "@/server/guard";
import { ANALYTICS_PERIODS, getAnalyticsDashboard, type AnalyticsPeriod } from "@/server/services/analytics";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const value = Number(new URL(request.url).searchParams.get("period"));
    const period = ANALYTICS_PERIODS.includes(value as AnalyticsPeriod) ? value as AnalyticsPeriod : 30;
    return Response.json(await getAnalyticsDashboard(period));
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
}
