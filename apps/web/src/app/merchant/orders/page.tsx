import { AppShell } from "@/components/layout/app-shell";
import { OrdersManager } from "@/features/orders/components/orders-manager";
import { requireRole } from "@/features/auth/server-auth";

export default async function OrdersPage() {
  await requireRole(["MERCHANT"]);
  return (
    <AppShell
      title="Orders & QR"
      description="Manage table ordering and invoices"
    >
      <OrdersManager />
    </AppShell>
  );
}
