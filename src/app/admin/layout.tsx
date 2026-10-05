import { AdminSidebar } from "@/components/admin/sidebar";
import { auth } from "@/server/auth";

// Admin reads live DB data and the session — never prerender.
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Unauthenticated requests to protected /admin pages are already redirected
  // to /admin/login by middleware. When there's no session we therefore only
  // ever render the login page — without the sidebar chrome.
  if (!session?.user) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-[#f2fbff]">
      <AdminSidebar email={session.user.email ?? ""} />
      <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
