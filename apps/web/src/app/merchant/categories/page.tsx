import { AppShell } from "@/components/layout/app-shell";
import { requireRole } from "@/features/auth/server-auth";
import { CategoryManager } from "@/features/stores/components/category-manager";

export default async function CategoriesPage() {
  await requireRole(["MERCHANT"]);
  return (
    <AppShell title="Categories" description="Organize your storefront menu">
      <CategoryManager />
    </AppShell>
  );
}
