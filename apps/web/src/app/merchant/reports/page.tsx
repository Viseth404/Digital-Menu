import { AppShell } from "@/components/layout/app-shell";
import { requireRole } from "@/features/auth/server-auth";
import { ReportsManager } from "@/features/reports/components/reports-manager";

export default async function ReportsPage() {
  await requireRole(["MERCHANT"]);

  return (
    <AppShell
      title="Reports"
      description="Review, close, and export sales reports"
    >
      <ReportsManager />
    </AppShell>
  );
}
