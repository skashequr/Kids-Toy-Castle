import { connectDB } from "../db/connect";
import { Newsletter } from "../models/Newsletter";

export type SubscriberRow = {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  subscribedAt: string;
};

export async function getSubscribers(): Promise<SubscriberRow[]> {
  await connectDB();
  const docs = await Newsletter.find({}).sort({ createdAt: -1 }).lean();
  return docs.map((d) => ({
    id: String(d._id),
    email: d.email,
    name: (d.name as string) ?? "",
    isActive: d.isActive ?? false,
    subscribedAt: new Date((d.subscribedAt ?? d.createdAt) as Date).toISOString(),
  }));
}
