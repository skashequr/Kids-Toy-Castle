import { connectDB } from "../db/connect";
import { ContactMessage } from "../models/ContactMessage";

export type ContactRow = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export async function getContactMessages(): Promise<ContactRow[]> {
  await connectDB();
  const docs = await ContactMessage.find({}).sort({ createdAt: -1 }).lean();
  return docs.map((d) => ({
    id: String(d._id),
    name: d.name,
    email: d.email,
    subject: (d.subject as string) ?? "",
    message: d.message,
    isRead: d.isRead ?? false,
    createdAt: new Date(d.createdAt as Date).toISOString(),
  }));
}
