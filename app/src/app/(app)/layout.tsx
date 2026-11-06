import { requireTenant } from "@/lib/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { and, eq, count } from "drizzle-orm";
import { logoutAction } from "@/app/actions/auth";
import { aiAvailable } from "@/lib/ai";
import Sidebar from "@/components/Sidebar";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const tenant = await requireTenant();
  const unread = await db
    .select({ n: count() })
    .from(notifications)
    .where(and(eq(notifications.businessId, tenant.businessId), eq(notifications.read, false)));
  const unreadCount = Number(unread[0]?.n ?? 0);

  const nav = [
    // Workspace
    { href: "/dashboard", label: "Dashboard", group: "work", icon: "M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10" },
    { href: "/studio", label: "AI Proposal Studio", group: "work", icon: "M12 3v1m0 16v1m9-9h-1M4 12H3m15.36 6.36l-.7-.7M6.34 6.34l-.7-.7m12.72 0l-.7.7M6.34 17.66l-.7.7M16 12a4 4 0 11-8 0 4 4 0 018 0z", highlight: true },
    { href: "/proposals", label: "Proposals", group: "work", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
    { href: "/quotations", label: "Quotations", group: "work", icon: "M9 7h6m-6 4h6m-6 4h3m6-11v16l-3-2-3 2-3-2-3 2V4a1 1 0 011-1h10a1 1 0 011 1z" },
    { href: "/receipts", label: "Receipts", group: "work", icon: "M9 14l2 2 4-4m5 7V7a2 2 0 00-2-2H6a2 2 0 00-2 2v12l3-2 3 2 3-2 3 2z" },
    // Commercial
    { href: "/clients", label: "Clients / CRM", group: "sell", icon: "M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6-4a3 3 0 11-3-3" },
    { href: "/payments", label: "Payments", group: "sell", icon: "M3 10h18M7 15h2m4 0h2M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" },
    { href: "/finance", label: "Financial Dashboard", group: "sell", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
    { href: "/analytics", label: "Analytics", group: "sell", icon: "M7 12l3-3 3 3 4-4m4 8V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2z" },
    // Manage
    { href: "/projects", label: "Projects", group: "manage", icon: "M19 11V9a2 2 0 00-2-2h-4l-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-3m-5 3l3-3-3-3" },
    { href: "/services", label: "Services & Packages", group: "manage", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
    { href: "/portfolio", label: "Portfolio & Credentials", group: "manage", icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" },
    { href: "/notifications", label: "Notifications", group: "manage", icon: "M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 00-4-5.7V5a2 2 0 10-4 0v.3A6 6 0 006 11v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" },
    { href: "/activity", label: "Activity Log", group: "manage", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
    { href: "/settings", label: "Business Settings", group: "manage", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
  ];

  return (
    <div className="ambient min-h-screen">
      <Sidebar nav={nav} businessName={tenant.businessName} userName={tenant.user.name} unreadCount={unreadCount} aiReady={aiAvailable()} logoutAction={logoutAction} />
      <main className="lg:pl-64">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
