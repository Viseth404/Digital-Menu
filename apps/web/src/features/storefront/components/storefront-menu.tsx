"use client";

import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import { StoreInfoDrawer } from "@/features/stores/components/store-info-drawer";
import {
  CategoryTabs,
  EmptyMenu,
  MenuSectionHeader,
  ProductCard,
  StoreFooter,
  StoreHero,
  StoreSearch,
} from "@/features/storefront/components/menu-elements";
import type {
  StorefrontCategory,
  StorefrontStore,
} from "@/features/storefront/types";
import {
  ALL_CATEGORIES,
  countProducts,
  createStorefrontStyle,
  filterStorefrontCategories,
} from "@/features/storefront/utils";
import {
  OrderCart,
  type CartEntry,
} from "@/features/storefront/components/order-cart";
import { PromotionPopup } from "@/features/storefront/components/promotion-popup";
import { ProductCustomizer } from "@/features/storefront/components/product-customizer";
import { STOREFRONT_PALETTE } from "@/features/storefront/constants";
import type { StorefrontProduct } from "@/features/storefront/types";

type StorefrontMenuProps = {
  store: StorefrontStore;
  categoryGroups: StorefrontCategory[];
};

export function StorefrontMenu({ store, categoryGroups }: StorefrontMenuProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORIES);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState<"en" | "km">("en");
  const [cart, setCart] = useState<Record<string, CartEntry>>({});
  const [customizing, setCustomizing] = useState<StorefrontProduct | null>(
    null,
  );

  const localizedGroups = useMemo(
    () =>
      categoryGroups.map((group) => ({
        ...group,
        name: language === "km" && group.nameKh ? group.nameKh : group.name,
        products: group.products.map((product) => ({
          ...product,
          name:
            language === "km" && product.nameKh ? product.nameKh : product.name,
          description:
            language === "km" && product.descriptionKh
              ? product.descriptionKh
              : product.description,
          optionGroups: product.optionGroups.map((optionGroup) => ({
            ...optionGroup,
            name:
              language === "km" && optionGroup.nameKh
                ? optionGroup.nameKh
                : optionGroup.name,
            options: optionGroup.options.map((option) => ({
              ...option,
              name:
                language === "km" && option.nameKh
                  ? option.nameKh
                  : option.name,
            })),
          })),
        })),
      })),
    [categoryGroups, language],
  );
  const filteredGroups = useMemo(
    () => filterStorefrontCategories(localizedGroups, activeCategory, search),
    [activeCategory, localizedGroups, search],
  );
  const totalProducts = countProducts(categoryGroups);
  const palette = darkMode ? STOREFRONT_PALETTE.dark : STOREFRONT_PALETTE.light;
  const style = {
    ...createStorefrontStyle(store.primaryColor, store.accentColor),
    "--menu-bg": palette.background,
    "--menu-card": palette.card,
    "--menu-text": palette.text,
    "--menu-muted": palette.muted,
  } as CSSProperties;
  const cartEntries = Object.values(cart);
  const localizedStore = {
    ...store,
    name: language === "km" && store.nameKh ? store.nameKh : store.name,
    description:
      language === "km" && store.descriptionKh
        ? store.descriptionKh
        : store.description,
  };

  function changeQuantity(entryKey: string, quantity: number) {
    setCart((current) => {
      if (quantity <= 0) {
        const next = { ...current };
        delete next[entryKey];
        return next;
      }
      const entry = current[entryKey];
      return entry
        ? { ...current, [entryKey]: { ...entry, quantity } }
        : current;
    });
  }

  return (
    <main
      style={style}
      className="min-h-screen overflow-x-clip bg-[var(--menu-bg)] text-[var(--menu-text)] transition-colors"
    >
      <div className="mx-auto max-w-[1440px] bg-[var(--menu-bg)] lg:my-6 lg:overflow-hidden lg:rounded-[2rem] lg:shadow-[0_24px_80px_rgba(77,55,23,0.12)]">
        <StoreHero
          store={localizedStore}
          darkMode={darkMode}
          onToggleTheme={() => setDarkMode((value) => !value)}
          language={language}
          onToggleLanguage={() =>
            setLanguage((value) => (value === "en" ? "km" : "en"))
          }
        />

        <div className="sticky top-0 z-30 border-b border-[#7A6A52]/15 bg-[var(--menu-bg)]/95 pt-14 shadow-[0_8px_28px_rgba(75,55,24,0.04)] backdrop-blur-xl sm:pt-16">
          <div className="mx-auto max-w-[1180px] px-4 pb-3 sm:px-8">
            <StoreSearch
              value={search}
              onChange={setSearch}
              language={language}
              infoButton={
                <StoreInfoDrawer
                  language={language}
                  name={localizedStore.name}
                  description={localizedStore.description}
                  address={store.address}
                  phone={store.phone}
                  email={store.email}
                  currency={store.currency}
                  socialLinks={store.socialLinks}
                />
              }
            />
            {categoryGroups.length ? (
              <CategoryTabs
                groups={localizedGroups}
                activeCategory={activeCategory}
                allCategoriesValue={ALL_CATEGORIES}
                onChange={setActiveCategory}
                language={language}
              />
            ) : null}
          </div>
        </div>

        <div
          id="menu"
          className="mx-auto max-w-[1180px] scroll-mt-40 px-4 py-9 sm:px-8 sm:py-14"
        >
          <MenuSectionHeader
            totalProducts={totalProducts}
            language={language}
          />

          {filteredGroups.length ? (
            <div className="space-y-12 sm:space-y-16">
              {filteredGroups.map((group) => (
                <section
                  key={group.id}
                  id={`category-${group.id}`}
                  className="scroll-mt-44"
                >
                  <div className="mb-5 flex items-center gap-3">
                    <h3 className="text-xl font-bold tracking-tight text-[var(--menu-text)] sm:text-2xl">
                      {group.name}
                    </h3>
                    <span className="rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-2.5 py-1 text-xs font-bold text-[var(--menu-muted)]">
                      {group.products.length}
                    </span>
                  </div>
                  <div className="grid gap-3.5 lg:grid-cols-2 lg:gap-4">
                    {group.products.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        currency={store.currency}
                        exchangeRate={store.exchangeRate}
                        language={language}
                        onAdd={
                          store.orderingTable
                            ? () => {
                                if (product.optionGroups.length) {
                                  setCustomizing(product);
                                  return;
                                }
                                setCart((current) => ({
                                  ...current,
                                  [product.id]: {
                                    key: product.id,
                                    product,
                                    selectedOptions: [],
                                    quantity:
                                      (current[product.id]?.quantity ?? 0) + 1,
                                  },
                                }));
                              }
                            : undefined
                        }
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <EmptyMenu search={search} language={language} />
          )}
        </div>

        {store.orderingTable ? (
          <OrderCart
            store={localizedStore}
            entries={cartEntries}
            language={language}
            onQuantityChange={changeQuantity}
            onOrderPlaced={() => setCart({})}
          />
        ) : null}
        {customizing ? (
          <ProductCustomizer
            product={customizing}
            currency={store.currency}
            exchangeRate={store.exchangeRate}
            language={language}
            onClose={() => setCustomizing(null)}
            onAdd={(selectedOptions) => {
              const entryKey = `${customizing.id}:${selectedOptions
                .map((option) => option.id)
                .sort()
                .join(",")}`;
              setCart((current) => ({
                ...current,
                [entryKey]: {
                  key: entryKey,
                  product: customizing,
                  selectedOptions,
                  quantity: (current[entryKey]?.quantity ?? 0) + 1,
                },
              }));
              setCustomizing(null);
            }}
          />
        ) : null}

        <StoreFooter storeName={localizedStore.name} language={language} />
      </div>
      <PromotionPopup
        storeKey={`${store.merchantSlug}:${store.storeSlug}`}
        storeName={store.name}
        promotion={store.promotion}
        language={language}
      />
    </main>
  );
}
