import { AppShell } from "@/components/layout/app-shell";
import { requireRole } from "@/features/auth/server-auth";
import { MerchantSupportConsole } from "@/features/admin-support/components/merchant-support-console";

export default async function MerchantsPage() {
  await requireRole(["ADMIN"]);

  return (
    <AppShell title="Merchants" description="Platform support and control">
      <MerchantSupportConsole />
    </AppShell>
  );
}
