import { AdminSettingsClient } from "@/components/admin/settings-client";
import { getSettings } from "@/server/services/settings";

export const metadata = { title: "Settings | Luxen Admin" };

export default async function AdminSettingsPage() {
  const settings = await getSettings();
  return <AdminSettingsClient initial={settings} />;
}
