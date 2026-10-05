import { AdminAnalyticsClient } from "@/components/admin/analytics-client";
import { getAnalyticsDashboard } from "@/server/services/analytics";

export const metadata = { title: "Analytics | Kids Toy Castle Admin" };

export default async function AdminAnalyticsPage() {
  const initial = await getAnalyticsDashboard(30);
  return <AdminAnalyticsClient initial={initial} />;
}
