import { connectDB } from "../db/connect";
import { Order } from "../models/Order";
import { toOrder } from "../mappers";
import type { Order as OrderType } from "@/types";

export async function getOrders(): Promise<OrderType[]> {
  await connectDB();
  const docs = await Order.find({}).sort({ createdAt: -1 }).lean();
  return docs.map(toOrder);
}

export async function getOrderByNumber(orderNumber: string): Promise<OrderType | null> {
  await connectDB();
  const doc = await Order.findOne({ orderNumber: orderNumber.trim() }).lean();
  return doc ? toOrder(doc) : null;
}
