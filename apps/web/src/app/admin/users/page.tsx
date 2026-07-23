import { AppShell } from "@/components/layout/app-shell";
import { requireRole } from "@/features/auth/server-auth";
import { MerchantUsersManager } from "@/features/merchant-users/components/merchant-users-manager";

export default async function PlatformUsersPage() {
  await requireRole(["ADMIN"]);

  return (
    <AppShell
      title="Platform users"
      description="Create and manage merchant owners"
    >
      <MerchantUsersManager />
    </AppShell>
  );
}
