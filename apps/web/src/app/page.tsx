import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/features/auth/server-auth";
import { StoreAnalyticsDashboard } from "@/features/dashboard/components/store-analytics-dashboard";
import { PlatformOverviewDashboard } from "@/features/admin-support/components/platform-overview";

export default async function DashboardPage() {
  const user = await requireUser();

  if (user.role === "ADMIN") {
    return (
      <AppShell
        title="Platform overview"
        description="Administrator control center"
      >
        <PlatformOverviewDashboard />
      </AppShell>
    );
  }

  return (
    <AppShell title="Dashboard" description="Restaurant overview">
      <StoreAnalyticsDashboard />
    </AppShell>
  );
}
