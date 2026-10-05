import { buildWorkbook } from "@/lib/orders-workbook";
import { requireAdmin } from "@/server/guard";
import {
  getDashboardExportRows,
  normalizeDashboardRange,
} from "@/server/services/dashboard";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const params = new URL(request.url).searchParams;
    const range = normalizeDashboardRange(params.get("from"), params.get("to"));
    const rows = await getDashboardExportRows(range);
    const archive = buildWorkbook(range, rows);
    const body = archive.buffer.slice(archive.byteOffset, archive.byteOffset + archive.byteLength) as ArrayBuffer;

    return new Response(body, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="dashboard-${range.from}-to-${range.to}.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
}
