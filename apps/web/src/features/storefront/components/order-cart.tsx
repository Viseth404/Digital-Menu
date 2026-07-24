"use client";

import * as React from "react";
import {
  CheckCircle2Icon,
  ChevronUpIcon,
  MinusIcon,
  PlusIcon,
  ReceiptTextIcon,
  ShoppingBasketIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { createPublicOrder } from "@/features/orders/orders-api";
import type { StoreOrder } from "@/features/orders/types";
import { formatStorePrice } from "@/features/stores/format";
import { createStorefrontStyle } from "@/features/storefront/utils";
import {
  STOREFRONT_COPY,
  type StorefrontLanguage,
} from "@/features/storefront/constants";
import type { StorefrontProduct, StorefrontStore } from "../types";
import type { SelectedProductOption } from "./product-customizer";

export type CartEntry = {
  key: string;
  product: StorefrontProduct;
  quantity: number;
  selectedOptions: SelectedProductOption[];
};

export function OrderCart({
  store,
  entries,
  language,
  onQuantityChange,
  onOrderPlaced,
}: {
  store: StorefrontStore;
  entries: CartEntry[];
  language: StorefrontLanguage;
  onQuantityChange: (entryKey: string, quantity: number) => void;
  onOrderPlaced: () => void;
}) {
  const copy = STOREFRONT_COPY[language];
  const [note, setNote] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [invoice, setInvoice] = React.useState<StoreOrder | null>(null);
  const itemCount = entries.reduce((total, entry) => total + entry.quantity, 0);
  const total = entries.reduce(
    (sum, entry) =>
      sum +
      (Number(entry.product.price) +
        entry.selectedOptions.reduce(
          (optionSum, option) => optionSum + option.priceDelta,
          0,
        )) *
        entry.quantity,
    0,
  );
  const formattedTotal = formatStorePrice(
    total,
    store.currency,
    store.exchangeRate,
  );

  async function submitOrder() {
    if (!store.orderingTable) return;
    if (!entries.length) return;
    setSubmitting(true);
    setMessage("");
    try {
      const result = await createPublicOrder(
        store.merchantSlug,
        store.storeSlug,
        {
          tableId: store.orderingTable.id,
          tableToken: store.orderingTable.token,
          note: note.trim() || undefined,
          items: entries.map(({ product, quantity, selectedOptions }) => ({
            productId: product.id,
            quantity,
            selectedOptionIds: selectedOptions.map((option) => option.id),
          })),
        },
      );
      setInvoice(result);
      setNote("");
      onOrderPlaced();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to place order",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet>
      <SheetTrigger
        aria-label={
          itemCount
            ? `View order with ${itemCount} items, total ${formattedTotal}`
            : copy.startOrder
        }
        className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 right-4 z-50 flex min-h-16 items-center gap-3 rounded-2xl border-2 border-[#D4AF37] bg-[#155D32] px-4 py-2.5 text-left text-white shadow-[0_16px_40px_rgba(9,47,27,0.38)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#1b6b3b] hover:shadow-[0_20px_48px_rgba(9,47,27,0.44)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4AF37] motion-reduce:transition-none sm:bottom-8 sm:left-auto sm:right-8 sm:min-w-64 sm:rounded-full"
      >
        <span className="relative grid size-10 shrink-0 place-items-center rounded-full bg-white/12">
          <ShoppingBasketIcon className="size-5" />
          {itemCount ? (
            <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-[#D4AF37] text-[0.65rem] font-extrabold text-[#1B1B1B] ring-2 ring-[#155D32]">
              {itemCount > 99 ? "99+" : itemCount}
            </span>
          ) : null}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold leading-tight">
            {itemCount ? copy.viewOrder : copy.startOrder}
          </span>
          <span className="mt-0.5 block truncate text-xs text-white/75">
            {itemCount
              ? `${itemCount} ${itemCount === 1 ? copy.item : copy.items} · ${formattedTotal}`
              : `${copy.orderingForTable} ${store.orderingTable?.number}`}
          </span>
        </span>
        <ChevronUpIcon className="size-5 shrink-0 text-[#D4AF37]" />
      </SheetTrigger>
      <SheetContent
        style={createStorefrontStyle(store.primaryColor, store.accentColor)}
        className="w-full gap-0 bg-[#FFFDF8] text-[#1B1B1B] sm:max-w-md"
      >
        {invoice ? (
          <Invoice
            order={invoice}
            language={language}
            onDone={() => {
              setInvoice(null);
              setMessage("");
            }}
          />
        ) : (
          <>
            <SheetHeader className="border-b p-6 pr-12">
              <SheetTitle className="text-xl font-bold">
                {copy.yourOrder}
              </SheetTitle>
              <SheetDescription>
                {copy.table} {store.orderingTable?.number} · {copy.confirmItems}
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="rounded-xl border bg-[var(--store-accent)] p-3 text-sm font-semibold text-[var(--store-primary)]">
                {copy.orderingForTable} {store.orderingTable?.number}
              </div>

              <div className="my-5 divide-y">
                {entries.length ? (
                  entries.map(({ key, product, quantity, selectedOptions }) => (
                    <div key={key} className="flex items-center gap-3 py-4">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{product.name}</p>
                        {selectedOptions.length ? (
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                            {selectedOptions
                              .map((option) => option.name)
                              .join(" · ")}
                          </p>
                        ) : null}
                        <p className="text-sm text-[var(--store-primary)]">
                          {formatStorePrice(
                            Number(product.price) +
                              selectedOptions.reduce(
                                (sum, option) => sum + option.priceDelta,
                                0,
                              ),
                            store.currency,
                            store.exchangeRate,
                          )}
                        </p>
                      </div>
                      <div className="flex items-center rounded-full border">
                        <QuantityButton
                          label={`Remove one ${product.name}`}
                          onClick={() => onQuantityChange(key, quantity - 1)}
                        >
                          <MinusIcon />
                        </QuantityButton>
                        <span className="w-8 text-center text-sm font-semibold">
                          {quantity}
                        </span>
                        <QuantityButton
                          label={`Add one ${product.name}`}
                          onClick={() => onQuantityChange(key, quantity + 1)}
                        >
                          <PlusIcon />
                        </QuantityButton>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    {copy.emptyOrder}
                  </p>
                )}
              </div>

              <label className="grid gap-1.5 text-sm font-medium">
                {copy.kitchenNote}
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder={copy.kitchenNotePlaceholder}
                  className="rounded-lg border bg-transparent p-3 text-sm outline-none focus-visible:ring-2"
                />
              </label>
              {message ? (
                <p className="mt-3 text-sm text-destructive">{message}</p>
              ) : null}
            </div>
            <div className="border-t p-6">
              <div className="mb-4 flex justify-between font-semibold">
                <span>{copy.total}</span>
                <span>
                  {formatStorePrice(total, store.currency, store.exchangeRate)}
                </span>
              </div>
              <Button
                className="h-12 w-full rounded-xl border border-[#D4AF37]/70 bg-[var(--store-primary)] text-base font-bold text-[var(--store-on-primary)] shadow-[0_10px_24px_rgba(21,93,50,0.2)] hover:brightness-110 disabled:border-transparent disabled:bg-zinc-200 disabled:text-zinc-500 disabled:shadow-none"
                disabled={!entries.length || submitting}
                onClick={() => void submitOrder()}
              >
                <ShoppingBasketIcon />
                {submitting
                  ? copy.sendingOrder
                  : entries.length
                    ? `${copy.placeOrder} · ${formattedTotal}`
                    : copy.addItems}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function QuantityButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-8 place-items-center text-zinc-500 hover:text-zinc-900 [&_svg]:size-3"
    >
      {children}
    </button>
  );
}

function Invoice({
  order,
  language,
  onDone,
}: {
  order: StoreOrder;
  language: StorefrontLanguage;
  onDone: () => void;
}) {
  const copy = STOREFRONT_COPY[language];
  return (
    <div className="flex h-full flex-col p-6">
      <div className="py-8 text-center">
        <CheckCircle2Icon className="mx-auto size-12 text-emerald-500" />
        <h2 className="mt-4 text-2xl font-bold">{copy.orderReceived}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{copy.invoiceSent}</p>
      </div>
      <div className="rounded-2xl border p-5">
        <div className="flex justify-between gap-4 border-b pb-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {copy.invoice} #{order.id.slice(-8).toUpperCase()}
            </p>
            <p className="mt-1 text-lg font-semibold">
              {copy.table} {order.table.number}
            </p>
          </div>
          <ReceiptTextIcon className="size-6 text-muted-foreground" />
        </div>
        <div className="divide-y py-2">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex justify-between gap-4 py-2 text-sm"
            >
              <span>
                {item.quantity} × {item.productName}
                {item.options.length ? (
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {item.options
                      .map((option) => option.optionName)
                      .join(" · ")}
                  </span>
                ) : null}
              </span>
              <span>{formatInvoiceMoney(item.lineTotal, order.currency)}</span>
            </div>
          ))}
        </div>
        <p className="flex justify-between border-t pt-4 font-bold">
          <span>{copy.total}</span>
          <span>{formatInvoiceMoney(order.subtotal, order.currency)}</span>
        </p>
      </div>
      <Button className="mt-6 h-11" onClick={onDone}>
        {copy.orderMore}
      </Button>
    </div>
  );
}

function formatInvoiceMoney(value: string, currency: string) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "KHR" ? 0 : 2,
  }).format(Number(value));
}
