import { AppShell } from "@/components/layout/app-shell";
import { AdminOperations } from "@/features/admin-support/components/admin-operations";
import { requireRole } from "@/features/auth/server-auth";

export default async function AdminOperationsPage() {
  await requireRole(["ADMIN"]);
  return (
    <AppShell
      title="Platform operations"
      description="Subscriptions, onboarding, security, and merchant lifecycle"
    >
      <AdminOperations />
    </AppShell>
  );
}
