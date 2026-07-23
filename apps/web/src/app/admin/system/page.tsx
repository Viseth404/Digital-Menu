import { AppShell } from "@/components/layout/app-shell";
import { SystemConsole } from "@/features/admin-support/components/system-console";
import { requireRole } from "@/features/auth/server-auth";

export default async function SystemPage() {
  await requireRole(["ADMIN"]);
  return (
    <AppShell title="System" description="Health, maintenance, and settings">
      <SystemConsole />
    </AppShell>
  );
}
