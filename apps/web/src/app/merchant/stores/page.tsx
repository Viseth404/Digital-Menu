import { AppShell } from "@/components/layout/app-shell";
import { requireRole } from "@/features/auth/server-auth";
import { StoreSettingsManager } from "@/features/stores/components/store-settings-manager";

export default async function StoresPage() {
  await requireRole(["MERCHANT"]);

  return (
    <AppShell
      title="My stores"
      description="Design and publish your storefront"
    >
      <StoreSettingsManager />
    </AppShell>
  );
}
