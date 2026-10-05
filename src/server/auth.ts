import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";
import { connectDB } from "./db/connect";
import { AdminUser } from "./models/AdminUser";
import { Customer } from "./models/Customer";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").toLowerCase().trim();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        await connectDB();
        const admin = await AdminUser.findOne({ email }).lean();
        if (admin?.password) {
          const ok = await bcrypt.compare(password, admin.password);
          if (ok) {
            return {
              id: String(admin._id),
              email: admin.email,
              name: admin.name ?? "Admin",
              role: admin.role ?? "ADMIN",
            };
          }
        }

        return null;
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
  },
});
