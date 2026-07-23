import { AppShell } from "@/components/layout/app-shell";
import { requireRole } from "@/features/auth/server-auth";
import { ProductManager } from "@/features/stores/components/product-manager";

export default async function ProductsPage() {
  await requireRole(["MERCHANT"]);
  return (
    <AppShell
      title="Products & items"
      description="Manage your storefront menu"
    >
      <ProductManager />
    </AppShell>
  );
}
