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
import type { StorefrontProduct, StorefrontStore } from "../types";

export type CartEntry = {
  product: StorefrontProduct;
  quantity: number;
};

export function OrderCart({
  store,
  entries,
  onQuantityChange,
  onOrderPlaced,
}: {
  store: StorefrontStore;
  entries: CartEntry[];
  onQuantityChange: (productId: string, quantity: number) => void;
  onOrderPlaced: () => void;
}) {
  const [note, setNote] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [invoice, setInvoice] = React.useState<StoreOrder | null>(null);
  const itemCount = entries.reduce((total, entry) => total + entry.quantity, 0);
  const total = entries.reduce(
    (sum, entry) => sum + Number(entry.product.price) * entry.quantity,
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
          items: entries.map(({ product, quantity }) => ({
            productId: product.id,
            quantity,
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
            : "Open order basket"
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
            {itemCount ? "View your order" : "Start your order"}
          </span>
          <span className="mt-0.5 block truncate text-xs text-white/75">
            {itemCount
              ? `${itemCount} ${itemCount === 1 ? "item" : "items"} · ${formattedTotal}`
              : `Ordering for table ${store.orderingTable?.number}`}
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
            onDone={() => {
              setInvoice(null);
              setMessage("");
            }}
          />
        ) : (
          <>
            <SheetHeader className="border-b p-6 pr-12">
              <SheetTitle className="text-xl font-bold">Your order</SheetTitle>
              <SheetDescription>
                Table {store.orderingTable?.number} · Confirm your items before
                sending the order.
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="rounded-xl border bg-[var(--store-accent)] p-3 text-sm font-semibold text-[var(--store-primary)]">
                Ordering for table {store.orderingTable?.number}
              </div>

              <div className="my-5 divide-y">
                {entries.length ? (
                  entries.map(({ product, quantity }) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-3 py-4"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{product.name}</p>
                        <p className="text-sm text-[var(--store-primary)]">
                          {formatStorePrice(
                            product.price,
                            store.currency,
                            store.exchangeRate,
                          )}
                        </p>
                      </div>
                      <div className="flex items-center rounded-full border">
                        <QuantityButton
                          label={`Remove one ${product.name}`}
                          onClick={() =>
                            onQuantityChange(product.id, quantity - 1)
                          }
                        >
                          <MinusIcon />
                        </QuantityButton>
                        <span className="w-8 text-center text-sm font-semibold">
                          {quantity}
                        </span>
                        <QuantityButton
                          label={`Add one ${product.name}`}
                          onClick={() =>
                            onQuantityChange(product.id, quantity + 1)
                          }
                        >
                          <PlusIcon />
                        </QuantityButton>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    Select items from the menu to begin your order.
                  </p>
                )}
              </div>

              <label className="grid gap-1.5 text-sm font-medium">
                Note for the kitchen
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="No onion, less spicy…"
                  className="rounded-lg border bg-transparent p-3 text-sm outline-none focus-visible:ring-2"
                />
              </label>
              {message ? (
                <p className="mt-3 text-sm text-destructive">{message}</p>
              ) : null}
            </div>
            <div className="border-t p-6">
              <div className="mb-4 flex justify-between font-semibold">
                <span>Total</span>
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
                  ? "Sending order…"
                  : entries.length
                    ? `Place order · ${formattedTotal}`
                    : "Add items to place order"}
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

function Invoice({ order, onDone }: { order: StoreOrder; onDone: () => void }) {
  return (
    <div className="flex h-full flex-col p-6">
      <div className="py-8 text-center">
        <CheckCircle2Icon className="mx-auto size-12 text-emerald-500" />
        <h2 className="mt-4 text-2xl font-bold">Order received</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your invoice has been sent to the restaurant.
        </p>
      </div>
      <div className="rounded-2xl border p-5">
        <div className="flex justify-between gap-4 border-b pb-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Invoice #{order.id.slice(-8).toUpperCase()}
            </p>
            <p className="mt-1 text-lg font-semibold">
              Table {order.table.number}
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
              </span>
              <span>{formatInvoiceMoney(item.lineTotal, order.currency)}</span>
            </div>
          ))}
        </div>
        <p className="flex justify-between border-t pt-4 font-bold">
          <span>Total</span>
          <span>{formatInvoiceMoney(order.subtotal, order.currency)}</span>
        </p>
      </div>
      <Button className="mt-6 h-11" onClick={onDone}>
        Order more items
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
