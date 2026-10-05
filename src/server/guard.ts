import { auth } from "./auth";

/**
 * Throws if there is no authenticated admin session. Call at the top of every
 * admin mutation (Server Functions are reachable via direct POST, so each one
 * must verify auth independently).
 */
export async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || !role || role === "CUSTOMER") {
    throw new Error("Unauthorized");
  }
  return session;
}
