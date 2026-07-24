import { notFound } from "next/navigation";
import {
  findPublicStore,
  findQrOrderingTable,
  groupPublicProducts,
} from "@/features/stores/server";
import { STORE_SOCIALS } from "@/features/stores/constants";
import { StorefrontMenu } from "@/features/storefront/components/storefront-menu";
import { MaintenancePage } from "@/features/storefront/components/maintenance-page";
import { getPublicPlatformSettings } from "@/features/admin-support/server/settings";

export const dynamic = "force-dynamic";

type StorefrontPageProps = {
  params: Promise<{
    merchantSlug: string;
    storeSlug: string;
  }>;
  searchParams: Promise<{ table?: string; token?: string }>;
};

export default async function StorefrontPage({
  params,
  searchParams,
}: StorefrontPageProps) {
  const { merchantSlug, storeSlug } = await params;
  const { table, token } = await searchParams;
  const platform = await getPublicPlatformSettings();
  if (platform.maintenanceMode) {
    return (
      <MaintenancePage
        announcement={platform.announcement}
        supportEmail={platform.supportEmail}
      />
    );
  }

  const store = await loadStore(merchantSlug, storeSlug);
  const orderingTable = await findQrOrderingTable(store.id, table, token);

  const socialLinks = STORE_SOCIALS.map(({ key, label }) => [
    label,
    store[key],
  ]).filter((entry): entry is [string, string] => Boolean(entry[1]));

  const categoryGroups = groupPublicProducts(store.products);

  return (
    <StorefrontMenu
      store={{
        merchantSlug,
        storeSlug,
        name: store.name,
        nameKh: store.nameKh,
        description: store.description,
        descriptionKh: store.descriptionKh,
        address: store.address,
        phone: store.phone ?? store.merchant.phone,
        email: store.email ?? store.merchant.contactEmail,
        logoUrl: store.logoUrl,
        coverImageUrl: store.coverImageUrl,
        promotion:
          store.promotionEnabled &&
          store.promotionTitle &&
          store.promotionMessage
            ? {
                title: store.promotionTitle,
                message: store.promotionMessage,
                imageUrl: store.promotionImageUrl,
              }
            : null,
        primaryColor: store.primaryColor,
        accentColor: store.accentColor,
        currency: store.currency,
        exchangeRate: Number(store.exchangeRate),
        merchantName: store.merchant.name,
        socialLinks,
        orderingTable: orderingTable
          ? { ...orderingTable, token: token! }
          : null,
      }}
      categoryGroups={categoryGroups}
    />
  );
}

async function loadStore(merchantSlug: string, storeSlug: string) {
  const store = await findPublicStore(merchantSlug, storeSlug);

  if (!store) {
    notFound();
  }

  return store;
}
