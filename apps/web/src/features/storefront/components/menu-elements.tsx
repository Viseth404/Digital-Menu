import type { ReactNode } from "react";
import {
  ImageIcon,
  LayoutGridIcon,
  LanguagesIcon,
  MoonIcon,
  PlusIcon,
  SearchIcon,
  SunIcon,
} from "lucide-react";
import { appConfig } from "@/config/app-config";
import { KhmerOrnament } from "@/features/storefront/components/khmer-ornament";
import {
  STOREFRONT_COPY,
  type StorefrontLanguage,
} from "@/features/storefront/constants";
import { formatStorePrice } from "@/features/stores/format";
import type {
  StorefrontCategory,
  StorefrontProduct,
  StorefrontStore,
} from "../types";

export function StoreHero({
  store,
  darkMode,
  onToggleTheme,
  language,
  onToggleLanguage,
}: {
  store: StorefrontStore;
  darkMode: boolean;
  onToggleTheme: () => void;
  language: "en" | "km";
  onToggleLanguage: () => void;
}) {
  return (
    <header className="relative bg-[var(--menu-bg)] pt-3 sm:pt-5 lg:pt-6">
      <div className="group/hero relative mx-3 min-h-[17rem] overflow-hidden rounded-[1.75rem] border border-[#D4AF37]/25 bg-[var(--store-primary)] shadow-[0_18px_55px_rgba(17,49,31,0.2)] transition duration-500 hover:border-[#D4AF37]/45 hover:shadow-[0_24px_65px_rgba(17,49,31,0.27)] sm:mx-5 sm:min-h-[22rem] sm:rounded-[2.25rem] lg:mx-6 lg:min-h-[25rem]">
        <div className="absolute inset-0 bg-[var(--store-primary)]">
          {store.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={store.coverImageUrl}
              alt={`${store.name} restaurant cover`}
              className="size-full object-cover transition duration-[1600ms] ease-out motion-safe:group-hover/hero:scale-[1.035]"
            />
          ) : (
            <div className="size-full bg-[var(--store-primary)] opacity-95" />
          )}
          <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(10,35,22,0.88),transparent_62%),linear-gradient(to_right,rgba(9,31,19,0.44),transparent_35%,rgba(9,31,19,0.25))]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(212,175,55,0.22),transparent_42%)]" />
          <div
            aria-hidden="true"
            className="khmer-pattern absolute inset-0 opacity-[0.045]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-x-[12%] bottom-0 h-[84%] rounded-t-[999px] border border-b-0 border-[#D4AF37]/18 transition duration-700 motion-safe:group-hover/hero:inset-x-[11%] motion-safe:group-hover/hero:border-[#D4AF37]/30 sm:inset-x-[20%]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-x-[22%] bottom-0 h-[68%] rounded-t-[999px] border border-b-0 border-white/12 transition duration-700 motion-safe:group-hover/hero:inset-x-[21%] motion-safe:group-hover/hero:border-[#D4AF37]/24 sm:inset-x-[29%]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-x-[31%] bottom-0 h-[51%] rounded-t-[999px] border border-b-0 border-[#D4AF37]/12 sm:inset-x-[36%]"
          />
          <div
            aria-hidden="true"
            className="absolute -left-3 top-[16%] size-24 -rotate-12 opacity-20 transition duration-700 motion-safe:group-hover/hero:translate-x-2 motion-safe:group-hover/hero:rotate-0 motion-safe:group-hover/hero:opacity-30 sm:left-[5%] sm:size-32"
          >
            <KhmerOrnament
              size={128}
              className="size-full object-contain drop-shadow-[0_0_18px_rgba(212,175,55,0.22)] transition duration-700 motion-safe:group-hover/hero:rotate-3 motion-safe:group-hover/hero:scale-105"
            />
          </div>
          <div
            aria-hidden="true"
            className="absolute -right-2 bottom-[14%] size-20 rotate-12 opacity-15 transition duration-700 motion-safe:group-hover/hero:-translate-x-2 motion-safe:group-hover/hero:rotate-0 motion-safe:group-hover/hero:opacity-25 sm:right-[5%] sm:size-28"
          >
            <KhmerOrnament
              size={112}
              className="size-full object-contain transition duration-700 motion-safe:group-hover/hero:-rotate-6 motion-safe:group-hover/hero:scale-105"
            />
          </div>
        </div>

        <div className="relative mx-auto flex min-h-[17rem] max-w-[1180px] flex-col px-4 py-4 sm:min-h-[22rem] sm:px-7 sm:py-6 lg:min-h-[25rem]">
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onToggleLanguage}
              aria-label={
                language === "en"
                  ? "Show menu in Khmer"
                  : "Show menu in English"
              }
              className="flex h-11 items-center gap-2 rounded-full border border-white/25 bg-[#102c1d]/45 px-4 text-sm font-bold text-white shadow-lg backdrop-blur-md transition hover:border-[#D4AF37]/70 hover:bg-[#102c1d]/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4AF37]"
            >
              <LanguagesIcon className="size-4" />
              {language === "en" ? "ខ្មែរ" : "EN"}
            </button>
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={
                darkMode ? "Switch to light theme" : "Switch to dark theme"
              }
              className="group/theme grid size-11 place-items-center rounded-full border border-white/25 bg-[#102c1d]/45 text-white shadow-lg backdrop-blur-md transition duration-300 hover:rotate-6 hover:border-[#D4AF37]/70 hover:bg-[#102c1d]/70 hover:shadow-[0_0_24px_rgba(212,175,55,0.24)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4AF37]"
            >
              {darkMode ? (
                <SunIcon className="size-4 transition-transform duration-300 group-hover/theme:rotate-45" />
              ) : (
                <MoonIcon className="size-4 transition-transform duration-300 group-hover/theme:-rotate-12" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 mx-auto max-w-[1180px] px-4 sm:px-8">
        <div className="translate-y-1/2">
          <div className="store-logo group/logo pointer-events-auto relative size-24 sm:size-28">
            <KhmerOrnament
              size={112}
              className="pointer-events-none absolute inset-1 size-[calc(100%-0.5rem)] scale-75 rotate-[-35deg] object-contain opacity-15 drop-shadow-[0_10px_25px_rgba(212,175,55,0.35)] transition duration-700 ease-out group-hover/logo:scale-[1.45] group-hover/logo:rotate-0 group-hover/logo:opacity-55"
            />
            <span
              aria-hidden="true"
              className="logo-ripple pointer-events-none absolute inset-0 rounded-[1.9rem] border border-[#D4AF37]/60 opacity-0"
            />
            <span
              aria-hidden="true"
              className="logo-ripple logo-ripple-delayed pointer-events-none absolute inset-0 rounded-[1.9rem] border border-[#D4AF37]/45 opacity-0"
            />
            <span
              aria-hidden="true"
              className="absolute -inset-1 rounded-[2rem] border border-[#D4AF37]/35 opacity-70 transition duration-500 group-hover/logo:-inset-1.5 group-hover/logo:border-[#D4AF37]/70 group-hover/logo:opacity-100"
            />
            <div className="size-full">
              <div className="relative grid size-full place-items-center overflow-hidden rounded-[1.8rem] border-2 border-[#D4AF37]/65 bg-[#FFFDF8] p-2 shadow-[0_18px_45px_rgba(17,49,31,0.3)] transition duration-500 ease-out group-hover/logo:-translate-y-1.5 group-hover/logo:scale-[1.035] group-hover/logo:shadow-[0_26px_62px_rgba(17,49,31,0.4)]">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-1/2 -left-1/2 z-10 h-[180%] w-1/3 -rotate-12 bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent opacity-0 transition-all duration-700 group-hover/logo:left-[125%] group-hover/logo:opacity-100"
                />
                <div className="relative size-full overflow-hidden rounded-[1.3rem]">
                  {store.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={store.logoUrl}
                      alt={`${store.name} logo`}
                      className="size-full object-cover object-center transition duration-700 ease-out group-hover/logo:scale-105"
                    />
                  ) : (
                    <span className="grid size-full place-items-center text-4xl font-bold text-[var(--store-primary)]">
                      {store.name.charAt(0)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export function StoreSearch({
  value,
  onChange,
  infoButton,
  language,
}: {
  value: string;
  onChange: (value: string) => void;
  infoButton: ReactNode;
  language: StorefrontLanguage;
}) {
  const copy = STOREFRONT_COPY[language];
  return (
    <div className="flex gap-2.5">
      <label className="group/search flex h-12 min-w-0 flex-1 items-center gap-3 rounded-2xl border border-[#7A6A52]/20 bg-[var(--menu-card)] px-4 shadow-[0_8px_28px_rgba(92,69,31,0.07)] transition duration-300 hover:border-[#D4AF37]/45 hover:shadow-[0_12px_32px_rgba(92,69,31,0.1)] focus-within:border-[#D4AF37]/70 focus-within:ring-2 focus-within:ring-[#D4AF37]/15">
        <SearchIcon className="size-[1.1rem] shrink-0 text-[var(--store-primary)] transition-transform duration-300 group-focus-within/search:scale-110" />
        <span className="sr-only">{copy.search}</span>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={copy.search}
          aria-label={copy.search}
          className="min-w-0 flex-1 bg-transparent text-sm text-[var(--menu-text)] outline-none placeholder:text-[var(--menu-muted)]"
        />
      </label>
      {infoButton}
    </div>
  );
}

export function CategoryTabs({
  groups,
  activeCategory,
  allCategoriesValue,
  onChange,
  language,
}: {
  groups: StorefrontCategory[];
  activeCategory: string;
  allCategoriesValue: string;
  onChange: (category: string) => void;
  language: StorefrontLanguage;
}) {
  const copy = STOREFRONT_COPY[language];
  return (
    <nav
      aria-label={copy.menuCategories}
      className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <CategoryButton
        active={activeCategory === allCategoriesValue}
        label={copy.allMenu}
        overview
        onClick={() => onChange(allCategoriesValue)}
      />
      {groups.map((group) => (
        <CategoryButton
          key={group.id}
          active={activeCategory === group.id}
          label={group.name}
          onClick={() => onChange(group.id)}
        />
      ))}
    </nav>
  );
}

function CategoryButton({
  active,
  label,
  overview = false,
  onClick,
}: {
  active: boolean;
  label: string;
  overview?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`group/chip relative inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition duration-200 motion-safe:hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4AF37] ${
        active
          ? "border-transparent bg-[var(--store-primary)] text-[var(--store-on-primary)] ring-1 ring-inset ring-white/20 hover:brightness-105"
          : "border-[#7A6A52]/20 bg-[var(--menu-card)] text-[var(--menu-text)] shadow-[0_1px_2px_rgba(75,55,24,0.06)] hover:border-[var(--store-primary)]"
      }`}
    >
      {overview ? <LayoutGridIcon className="size-3.5" /> : null}
      {label}
    </button>
  );
}

export function MenuSectionHeader({
  totalProducts,
  language,
}: {
  totalProducts: number;
  language: StorefrontLanguage;
}) {
  const copy = STOREFRONT_COPY[language];
  return (
    <div className="mb-9">
      <div className="flex items-end justify-between gap-5">
        <div>
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.25em] text-[var(--store-primary)]">
            {copy.menuEyebrow}
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-[-0.025em] text-[var(--menu-text)] sm:text-4xl">
            {copy.menuTitle}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--menu-muted)] sm:text-base">
            {copy.menuDescription}
          </p>
        </div>
        <span className="mb-1 shrink-0 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1.5 text-xs font-bold text-[var(--menu-muted)]">
          {totalProducts} {totalProducts === 1 ? copy.item : copy.items}
        </span>
      </div>
      <div aria-hidden="true" className="mt-6 flex items-center gap-2">
        <span className="h-px flex-1 bg-[#7A6A52]/20" />
        <span className="size-8 shrink-0">
          <KhmerOrnament
            size={32}
            className="size-full object-contain drop-shadow-[0_3px_6px_rgba(212,175,55,0.2)]"
          />
        </span>
        <span className="h-px w-12 bg-[#7A6A52]/20" />
      </div>
    </div>
  );
}

export function ProductCard({
  product,
  currency,
  exchangeRate,
  onAdd,
  language,
}: {
  product: StorefrontProduct;
  currency: string;
  exchangeRate: number;
  onAdd?: () => void;
  language: StorefrontLanguage;
}) {
  const copy = STOREFRONT_COPY[language];
  return (
    <article className="group relative flex min-h-32 overflow-hidden rounded-2xl border border-[#7A6A52]/15 bg-[var(--menu-card)] shadow-[0_8px_28px_rgba(75,55,24,0.06)] transition duration-500 ease-out motion-safe:hover:-translate-y-1 motion-safe:hover:border-[#D4AF37]/40 motion-safe:hover:shadow-[0_20px_45px_rgba(75,55,24,0.14)]">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 -left-1/2 z-10 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 transition-all duration-700 group-hover:left-[115%] group-hover:opacity-100"
      />
      <div className="relative grid aspect-square w-[7.25rem] shrink-0 place-items-center overflow-hidden bg-[#efe7d7] sm:w-36 lg:w-40">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            className="size-full object-cover transition duration-700 ease-out motion-safe:group-hover:scale-110"
          />
        ) : (
          <div className="grid size-full place-items-center bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.12),transparent_55%)]">
            <ImageIcon
              className="size-7 text-[#7A6A52]/45"
              aria-hidden="true"
            />
            <span className="sr-only">{copy.noImage}</span>
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col p-3.5 sm:p-5">
        <h4 className="line-clamp-2 text-base font-bold leading-snug text-[var(--menu-text)] sm:text-lg">
          {product.name}
        </h4>
        {product.description ? (
          <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-[var(--menu-muted)] sm:text-sm">
            {product.description}
          </p>
        ) : null}
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <p className="text-base font-extrabold text-[var(--store-primary)] sm:text-lg">
            {formatStorePrice(product.price, currency, exchangeRate)}
          </p>
          {onAdd ? (
            <button
              type="button"
              onClick={onAdd}
              aria-label={`${copy.addToOrder}: ${product.name}`}
              className="group/add grid size-9 shrink-0 place-items-center rounded-full bg-[var(--store-primary)] text-[var(--store-on-primary)] shadow-sm transition duration-300 hover:scale-110 hover:brightness-110 hover:shadow-[0_8px_20px_rgba(21,93,50,0.28)] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4AF37]"
            >
              <PlusIcon className="size-4 transition-transform duration-300 group-hover/add:rotate-90" />
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function EmptyMenu({
  search,
  language,
}: {
  search: string;
  language: StorefrontLanguage;
}) {
  const copy = STOREFRONT_COPY[language];
  return (
    <div className="group/empty khmer-corner relative overflow-hidden rounded-3xl border border-dashed border-[#7A6A52]/25 bg-[var(--menu-card)] p-12 text-center shadow-[0_14px_40px_rgba(75,55,24,0.05)] transition duration-500 hover:border-[#D4AF37]/45 hover:shadow-[0_20px_50px_rgba(75,55,24,0.09)]">
      <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-[var(--store-accent)] transition duration-500 group-hover/empty:-translate-y-1 group-hover/empty:rotate-3">
        {search ? (
          <SearchIcon className="size-7 text-[var(--store-primary)] transition-transform duration-500 group-hover/empty:scale-110" />
        ) : (
          <KhmerOrnament
            size={40}
            className="size-10 object-contain drop-shadow-[0_3px_8px_rgba(212,175,55,0.24)] transition duration-500 group-hover/empty:rotate-6 group-hover/empty:scale-110"
          />
        )}
      </div>
      <p className="mt-4 font-semibold text-[var(--menu-text)]">
        {search ? copy.noDishes : copy.menuComingSoon}
      </p>
      <p className="mt-1 text-sm text-[var(--menu-muted)]">
        {search ? copy.adjustSearch : copy.noPublishedProducts}
      </p>
    </div>
  );
}

export function StoreFooter({
  storeName,
  language,
}: {
  storeName: string;
  language: StorefrontLanguage;
}) {
  const copy = STOREFRONT_COPY[language];
  return (
    <footer className="mt-14 border-t border-[#7A6A52]/15 px-5 py-10 text-center text-sm text-[var(--menu-muted)]">
      <p className="font-semibold text-[var(--menu-text)]">{storeName}</p>
      <p className="mt-3 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--menu-muted)]">
        {copy.footerAttribution}{" "}
        <span className="text-[var(--store-primary)]">{appConfig.name}</span>
      </p>
    </footer>
  );
}
