import { connectDB } from "../db/connect";
import { Customer } from "../models/Customer";

export type CustomerRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  ordersCount: number;
  totalSpent: number;
  loyaltyPoints: number;
  lastOrderAt: string | null;
  isActive: boolean;
  createdAt: string;
};

export async function getCustomers(): Promise<CustomerRow[]> {
  await connectDB();
  const docs = await Customer.find({}).sort({ createdAt: -1 }).lean();
  return docs.map((d) => ({
    id: String(d._id),
    name: d.name,
    email: d.email,
    phone: (d.phone as string) ?? "",
    city: (d.city as string) ?? "",
    ordersCount: d.ordersCount ?? 0,
    totalSpent: d.totalSpent ?? 0,
    loyaltyPoints: d.loyaltyPoints ?? 0,
    lastOrderAt: d.lastOrderAt ? new Date(d.lastOrderAt as Date).toISOString() : null,
    isActive: d.isActive ?? true,
    createdAt: new Date(d.createdAt as Date).toISOString(),
  }));
}
