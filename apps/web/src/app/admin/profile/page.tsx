import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { appConfig } from "@/config/app-config";
import { ProfileManager } from "@/features/auth/components/profile-manager";
import { getServerSessionUser } from "@/lib/server/session";

export default async function AdminProfilePage() {
  const user = await getServerSessionUser();
  if (!user) redirect(appConfig.routes.login);
  if (user.role !== "ADMIN") redirect(appConfig.routes.dashboard);
  return (
    <AppShell
      title="My profile"
      description="Control your Administrator account information"
    >
      <ProfileManager user={user} />
    </AppShell>
  );
}
