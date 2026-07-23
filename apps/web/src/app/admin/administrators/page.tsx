import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { appConfig } from "@/config/app-config";
import { AdministratorsManager } from "@/features/administrators/administrators-manager";
import { getServerSessionUser } from "@/lib/server/session";

export default async function AdministratorsPage() {
  const user = await getServerSessionUser();
  if (!user) redirect(appConfig.routes.login);
  if (user.role !== "ADMIN") redirect(appConfig.routes.dashboard);
  return (
    <AppShell
      title="Administrators"
      description="Manage accounts with full platform control"
    >
      <AdministratorsManager />
    </AppShell>
  );
}
