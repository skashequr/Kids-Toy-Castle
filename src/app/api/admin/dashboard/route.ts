import { requireAdmin } from "@/server/guard";
import { getDashboardStats, normalizeDashboardRange } from "@/server/services/dashboard";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const params = new URL(request.url).searchParams;
    const range = normalizeDashboardRange(params.get("from"), params.get("to"));
    return Response.json(await getDashboardStats(range));
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
}
