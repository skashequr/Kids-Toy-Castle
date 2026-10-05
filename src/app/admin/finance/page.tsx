import { AdminFinanceClient } from "@/components/admin/finance-client";
import { getFinanceData } from "@/server/services/finance";
import { orderPresetRange } from "@/lib/order-date-range";

export const metadata = { title: "Finance | Kids Toy Castle Admin" };

export default async function FinancePage() {
  const data = await getFinanceData();
  return <AdminFinanceClient data={data} initialRange={orderPresetRange(30)} />;
}
