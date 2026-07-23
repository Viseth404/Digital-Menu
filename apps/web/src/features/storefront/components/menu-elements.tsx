import { ImageIcon, PlusIcon, SearchIcon, StoreIcon } from "lucide-react";
import { formatStorePrice } from "@/features/stores/format";
import type { StorefrontProduct } from "../types";

export function CategoryButton({
  active,
  label,
  onClick,
  darkMode,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  darkMode: boolean;
}) {
  const inactiveStyle = darkMode
    ? "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
    : "border-black/10 bg-white text-zinc-600 hover:border-[var(--store-primary)]";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${
        active
          ? "border-[var(--store-primary)] bg-[var(--store-primary)] text-[var(--store-on-primary)]"
          : inactiveStyle
      }`}
    >
      {label}
    </button>
  );
}

export function ProductCard({
  product,
  currency,
  exchangeRate,
  darkMode,
  onAdd,
}: {
  product: StorefrontProduct;
  currency: string;
  exchangeRate: number;
  darkMode: boolean;
  onAdd?: () => void;
}) {
  return (
    <article
      className={`group flex min-h-32 gap-4 rounded-2xl border p-3 transition sm:min-h-40 sm:p-4 ${
        darkMode
          ? "border-white/10 bg-white/[0.04] hover:bg-white/[0.07]"
          : "border-black/[0.07] bg-white shadow-sm hover:-translate-y-0.5 hover:shadow-md"
      }`}
    >
      <div
        className={`grid aspect-square w-28 shrink-0 place-items-center overflow-hidden rounded-xl sm:w-32 ${
          darkMode ? "bg-white/5" : "bg-zinc-100"
        }`}
      >
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            className="size-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <ImageIcon className="size-7 text-zinc-300" />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col py-1">
        <h4 className="line-clamp-2 text-base font-bold sm:text-lg">
          {product.name}
        </h4>
        {product.description ? (
          <p className="mt-1.5 line-clamp-2 text-sm leading-5 text-zinc-500">
            {product.description}
          </p>
        ) : null}
        <div className="mt-auto flex items-end justify-between gap-3 pt-3">
          <p className="text-base font-bold text-[var(--store-primary)]">
            {formatStorePrice(product.price, currency, exchangeRate)}
          </p>
          {onAdd ? (
            <button
              type="button"
              onClick={onAdd}
              aria-label={`Add ${product.name} to order`}
              className="grid size-9 place-items-center rounded-full bg-[var(--store-primary)] text-[var(--store-on-primary)] transition hover:opacity-85"
            >
              <PlusIcon className="size-4" />
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function EmptyMenu({
  search,
  darkMode,
}: {
  search: string;
  darkMode: boolean;
}) {
  const Icon = search ? SearchIcon : StoreIcon;

  return (
    <div
      className={`rounded-2xl border border-dashed p-12 text-center ${
        darkMode
          ? "border-white/15 bg-white/[0.03]"
          : "border-black/10 bg-white"
      }`}
    >
      <Icon className="mx-auto size-8 text-zinc-400" />
      <p className="mt-4 font-semibold">
        {search ? "No dishes found" : "The menu is coming soon"}
      </p>
      <p className="mt-1 text-sm text-zinc-500">
        {search
          ? `Try another search instead of “${search}”.`
          : "This store has not published any products yet."}
      </p>
    </div>
  );
}
