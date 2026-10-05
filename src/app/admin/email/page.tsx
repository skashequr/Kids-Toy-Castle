import { AdminEmailClient } from "@/components/admin/email-client";
import { getSubscribers } from "@/server/services/newsletter";
import { requireAdmin } from "@/server/guard";
import { MarketingCampaign, WhatsAppContact } from "@/server/models/Marketing";

export const metadata = { title: "Email & WhatsApp Marketing | Luxen Admin" };

export default async function AdminEmailPage() {
  await requireAdmin();
  const subscribers = await getSubscribers();
  const [contacts, campaigns] = await Promise.all([
    WhatsAppContact.find({}).sort({ createdAt: -1 }).lean(),
    MarketingCampaign.find({}).sort({ createdAt: -1 }).limit(100).lean(),
  ]);
  return <AdminEmailClient
    subscribers={subscribers.map(s => ({ id: s.id, email: s.email, name: s.name, subscribedAt: s.subscribedAt, active: s.isActive }))}
    contacts={contacts.map(c => ({ id: String(c._id), name: String(c.name), phone: String(c.phone), active: Boolean(c.active) }))}
    campaigns={campaigns.map(c => ({ id: String(c._id), channel: String(c.channel), subject: String(c.subject), body: String(c.body), template: String(c.template), language: String(c.language), parameters: c.parameters as string[], status: String(c.status), accepted: Number(c.accepted), failed: Number(c.failed), date: new Date(c.createdAt as string).toISOString() }))}
    whatsappReady={Boolean(process.env.WHATSAPP_ACCESS_TOKEN && /^\d+$/.test(process.env.WHATSAPP_PHONE_NUMBER_ID ?? "") && /^v\d+\.\d+$/.test(process.env.WHATSAPP_GRAPH_VERSION ?? ""))}
  />;
}
