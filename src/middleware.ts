import NextAuth from "next-auth";
import { authConfig } from "@/server/auth.config";

// Edge-safe NextAuth instance (no DB). The `authorized` callback in authConfig
// gates /admin/* and redirects unauthenticated users to /admin/login.
export const { auth: middleware } = NextAuth(authConfig);

export default middleware;

export const config = {
  matcher: ["/admin/:path*"],
};
