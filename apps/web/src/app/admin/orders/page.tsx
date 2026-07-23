import { AppShell } from "@/components/layout/app-shell";
import { PlatformOrdersManager } from "@/features/admin-support/components/platform-orders";
import { requireRole } from "@/features/auth/server-auth";

export default async function AdminOrdersPage() {
  await requireRole(["ADMIN"]);
  return (
    <AppShell title="Platform orders" description="Invoice search and support">
      <PlatformOrdersManager />
    </AppShell>
  );
}
