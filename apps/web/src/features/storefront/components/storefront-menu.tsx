"use client";

import { useMemo, useState } from "react";
import { MoonIcon, SearchIcon, SunIcon, UtensilsIcon } from "lucide-react";
import { StoreInfoDrawer } from "@/features/stores/components/store-info-drawer";
import {
  CategoryButton,
  EmptyMenu,
  ProductCard,
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

type StorefrontMenuProps = {
  store: StorefrontStore;
  categoryGroups: StorefrontCategory[];
};

export function StorefrontMenu({ store, categoryGroups }: StorefrontMenuProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORIES);
  const [darkMode, setDarkMode] = useState(false);
  const [cart, setCart] = useState<Record<string, CartEntry>>({});

  const filteredGroups = useMemo(
    () => filterStorefrontCategories(categoryGroups, activeCategory, search),
    [activeCategory, categoryGroups, search],
  );
  const totalProducts = countProducts(categoryGroups);
  const style = createStorefrontStyle(store.primaryColor, store.accentColor);
  const cartEntries = Object.values(cart);

  function changeQuantity(productId: string, quantity: number) {
    setCart((current) => {
      if (quantity <= 0) {
        const next = { ...current };
        delete next[productId];
        return next;
      }
      const entry = current[productId];
      return entry
        ? { ...current, [productId]: { ...entry, quantity } }
        : current;
    });
  }

  return (
    <main
      style={style}
      className={`min-h-screen transition-colors ${
        darkMode ? "bg-[#11110f] text-zinc-100" : "bg-[#fafaf8] text-zinc-900"
      }`}
    >
      <section className="relative overflow-hidden">
        <div
          className={`absolute inset-0 ${darkMode ? "bg-zinc-900" : "bg-zinc-200"}`}
        >
          {store.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={store.coverImageUrl}
              alt=""
              className="size-full object-cover"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/20" />
        </div>

        <div className="relative mx-auto flex min-h-[19rem] max-w-6xl flex-col justify-between px-4 py-5 sm:min-h-[24rem] sm:px-6 sm:py-7">
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDarkMode((value) => !value)}
              aria-label="Toggle color theme"
              className="grid size-10 place-items-center rounded-full border border-white/25 bg-black/20 text-white backdrop-blur-md transition hover:bg-black/35"
            >
              {darkMode ? (
                <SunIcon className="size-4" />
              ) : (
                <MoonIcon className="size-4" />
              )}
            </button>
          </div>

          <div className="flex items-end gap-4 text-white sm:gap-5">
            <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl border border-white/30 bg-white shadow-xl sm:size-24">
              {store.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={store.logoUrl}
                  alt={`${store.name} logo`}
                  className="size-full object-cover"
                />
              ) : (
                <span
                  className="text-3xl font-bold"
                  style={{ color: store.primaryColor }}
                >
                  {store.name.charAt(0)}
                </span>
              )}
            </div>
            <div className="min-w-0 pb-1">
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/65">
                {store.merchantName}
              </p>
              <h1 className="truncate text-3xl font-bold tracking-tight sm:text-5xl">
                {store.name}
              </h1>
              {store.description ? (
                <p className="mt-2 line-clamp-2 max-w-2xl text-sm leading-6 text-white/75 sm:text-base">
                  {store.description}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <div
        className={`sticky top-0 z-30 border-b backdrop-blur-xl ${
          darkMode
            ? "border-white/10 bg-[#11110f]/90"
            : "border-black/5 bg-[#fafaf8]/90"
        }`}
      >
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
          <div className="flex gap-2">
            <label
              className={`flex h-11 min-w-0 flex-1 items-center gap-3 rounded-xl border px-4 ${
                darkMode
                  ? "border-white/10 bg-white/5"
                  : "border-black/10 bg-white shadow-sm"
              }`}
            >
              <SearchIcon className="size-4 shrink-0 text-zinc-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search dishes..."
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400"
              />
            </label>
            <StoreInfoDrawer
              name={store.name}
              description={store.description}
              address={store.address}
              phone={store.phone}
              email={store.email}
              currency={store.currency}
              socialLinks={store.socialLinks}
            />
          </div>

          {categoryGroups.length ? (
            <nav
              aria-label="Menu categories"
              className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]"
            >
              <CategoryButton
                active={activeCategory === ALL_CATEGORIES}
                label="All menu"
                onClick={() => setActiveCategory(ALL_CATEGORIES)}
                darkMode={darkMode}
              />
              {categoryGroups.map((group) => (
                <CategoryButton
                  key={group.id}
                  active={activeCategory === group.id}
                  label={group.name}
                  onClick={() => setActiveCategory(group.id)}
                  darkMode={darkMode}
                />
              ))}
            </nav>
          ) : null}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p
              className="text-xs font-bold uppercase tracking-[0.18em]"
              style={{ color: store.primaryColor }}
            >
              Our menu
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Pick something delicious
            </h2>
          </div>
          <span className="shrink-0 text-sm text-zinc-500">
            {totalProducts} {totalProducts === 1 ? "item" : "items"}
          </span>
        </div>

        {filteredGroups.length ? (
          <div className="space-y-12">
            {filteredGroups.map((group) => (
              <section key={group.id} id={`category-${group.id}`}>
                <div className="mb-5 flex items-center gap-3">
                  <h3 className="text-xl font-bold">{group.name}</h3>
                  <span className="rounded-full bg-[var(--store-accent)] px-2.5 py-1 text-xs font-semibold text-[var(--store-primary)]">
                    {group.products.length}
                  </span>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {group.products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      currency={store.currency}
                      exchangeRate={store.exchangeRate}
                      darkMode={darkMode}
                      onAdd={
                        store.orderingTable
                          ? () =>
                              setCart((current) => ({
                                ...current,
                                [product.id]: {
                                  product,
                                  quantity:
                                    (current[product.id]?.quantity ?? 0) + 1,
                                },
                              }))
                          : undefined
                      }
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <EmptyMenu search={search} darkMode={darkMode} />
        )}
      </div>

      {store.orderingTable ? (
        <OrderCart
          store={store}
          entries={cartEntries}
          onQuantityChange={changeQuantity}
          onOrderPlaced={() => setCart({})}
        />
      ) : null}

      <footer
        className={`mt-8 border-t px-5 py-8 text-center text-sm ${
          darkMode
            ? "border-white/10 text-zinc-500"
            : "border-black/5 text-zinc-500"
        }`}
      >
        <p className="flex items-center justify-center gap-2">
          <UtensilsIcon
            className="size-4"
            style={{ color: store.primaryColor }}
          />
          {store.name} · Made with care
        </p>
      </footer>
    </main>
  );
}
