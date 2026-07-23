import { AppShell } from "@/components/layout/app-shell";
import { AuditLogViewer } from "@/features/admin-support/components/audit-log-viewer";
import { requireRole } from "@/features/auth/server-auth";

export default async function AuditPage() {
  await requireRole(["ADMIN"]);
  return (
    <AppShell title="Audit log" description="Administrator security history">
      <AuditLogViewer />
    </AppShell>
  );
}
