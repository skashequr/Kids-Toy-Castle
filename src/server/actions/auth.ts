import bcrypt from "bcryptjs";
import { connectDB } from "@/server/db/connect";
import { Customer } from "@/server/models/Customer";

export type RegisterCustomerInput = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  city?: string;
};

export async function registerCustomer(input: RegisterCustomerInput) {
  await connectDB();

  const email = input.email.toLowerCase().trim();
  const existing = await Customer.findOne({ email }).lean();
  if (existing) {
    throw new Error("This email is already registered. Please sign in instead.");
  }

  const hashedPassword = await bcrypt.hash(input.password, 12);
  const customer = new Customer({
    name: input.name.trim(),
    email,
    password: hashedPassword,
    phone: input.phone?.trim(),
    city: input.city?.trim(),
  });

  await customer.save();
  return {
    id: String(customer._id),
    email: customer.email,
    name: customer.name,
  };
}
