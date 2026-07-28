"use client";

import * as React from "react";
import {
  BellRingIcon,
  ClipboardListIcon,
  CookingPotIcon,
  FileSpreadsheetIcon,
  PlusIcon,
  RefreshCwIcon,
  ReceiptTextIcon,
  TablePropertiesIcon,
  XIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getPublicStorePath } from "@/config/app-config";
import { exportExcelWorkbook } from "@/lib/excel-export";
import {
  getMerchantStores,
  getStoreProducts,
} from "@/features/stores/stores-api";
import type { Product, Store } from "@/features/stores/types";
import {
  createManualSale,
  createStoreTable,
  deleteStoreTable,
  getStoreOrders,
  getStoreTables,
  updateOrderStatus,
} from "../orders-api";
import {
  ORDER_FLOW,
  type DiningTable,
  type OrderStatus,
  type StoreOrder,
} from "../types";
import { SharedQrCard, TableQrCard } from "./table-qr-card";

type View = "orders" | "kitchen" | "tables";

export function OrdersManager() {
  const [store, setStore] = React.useState<Store | null>(null);
  const [orders, setOrders] = React.useState<StoreOrder[]>([]);
  const [tables, setTables] = React.useState<DiningTable[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [view, setView] = React.useState<View>("orders");
  const [loading, setLoading] = React.useState(true);
  const [message, setMessage] = React.useState("");
  const [origin, setOrigin] = React.useState("");
  const [unreadOrders, setUnreadOrders] = React.useState(0);
  const [alertsEnabled, setAlertsEnabled] = React.useState(false);
  const [recordingSale, setRecordingSale] = React.useState(false);
  const knownOrderIds = React.useRef<Set<string>>(new Set());
  const audioContext = React.useRef<AudioContext | null>(null);

  React.useEffect(() => setOrigin(window.location.origin), []);
  React.useEffect(
    () => () => {
      if (audioContext.current) void audioContext.current.close();
    },
    [],
  );
  React.useEffect(() => {
    getMerchantStores()
      .then((stores) => setStore(stores[0] ?? null))
      .catch((error: Error) => {
        setMessage(error.message);
        setLoading(false);
      });
  }, []);

  const loadData = React.useCallback(async () => {
    if (!store) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [tableData, orderData, productData] = await Promise.all([
        getStoreTables(store.id),
        getStoreOrders(store.id),
        getStoreProducts(store.id),
      ]);
      setTables(tableData);
      setOrders(orderData);
      setProducts(productData);
      if (!knownOrderIds.current.size) {
        knownOrderIds.current = new Set(orderData.map((order) => order.id));
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load");
    } finally {
      setLoading(false);
    }
  }, [store]);

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

  React.useEffect(() => {
    if (!store) return;

    const poll = async () => {
      try {
        const orderData = await getStoreOrders(store.id);
        const newOrders = orderData.filter(
          (order) => !knownOrderIds.current.has(order.id),
        );
        knownOrderIds.current = new Set(orderData.map((order) => order.id));
        setOrders(orderData);
        if (newOrders.length) {
          setUnreadOrders((count) => count + newOrders.length);
          void playOrderAlert(audioContext);
          if (
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            const newest = newOrders[0];
            new Notification(
              `${newOrders.length} new restaurant order${newOrders.length === 1 ? "" : "s"}`,
              {
                body: `${orderLocation(newest)} · ${newest.items.length} item${newest.items.length === 1 ? "" : "s"}`,
              },
            );
          }
        }
      } catch {
        // Keep the current board visible when a background refresh fails.
      }
    };

    const timer = window.setInterval(() => void poll(), 5_000);
    return () => window.clearInterval(timer);
  }, [store]);

  React.useEffect(() => {
    if (view === "orders" || view === "kitchen") setUnreadOrders(0);
  }, [view]);

  async function enableNotifications() {
    const soundEnabled = await playOrderAlert(audioContext);
    setAlertsEnabled(soundEnabled);

    if (!("Notification" in window)) {
      setMessage(
        soundEnabled
          ? "Test sound played. Browser pop-up notifications are not supported on this device."
          : "This browser blocked order sounds. Check the site's sound permission.",
      );
      return;
    }

    const permission = await Notification.requestPermission();
    if (!soundEnabled) {
      setMessage(
        "This browser blocked the test sound. Allow sound for this site, then try again.",
      );
    } else if (permission === "granted") {
      setMessage(
        "Test sound played. New-order sound and browser notifications are enabled.",
      );
    } else {
      setMessage(
        "Test sound played. Order sounds are enabled, but pop-up notifications were not allowed.",
      );
    }
  }

  async function addTable(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!store) return;
    const form = new FormData(event.currentTarget);
    try {
      const table = await createStoreTable(
        store.id,
        Number(form.get("number")),
      );
      setTables((current) =>
        [...current, table].sort((a, b) => a.number - b.number),
      );
      event.currentTarget.reset();
      setMessage(`Table ${table.number} created`);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to create table",
      );
    }
  }

  async function removeTable(table: DiningTable) {
    if (!store || !window.confirm(`Delete table ${table.number}?`)) return;
    try {
      await deleteStoreTable(store.id, table.id);
      setTables((current) => current.filter((item) => item.id !== table.id));
      setMessage(`Table ${table.number} deleted`);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to delete table",
      );
    }
  }

  async function changeStatus(order: StoreOrder, status: OrderStatus) {
    if (!store) return;
    const previousStatus = order.status;
    setOrders((current) =>
      current.map((item) =>
        item.id === order.id ? { ...item, status } : item,
      ),
    );
    try {
      const updated = await updateOrderStatus(store.id, order.id, status);
      setOrders((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (error) {
      setOrders((current) =>
        current.map((item) =>
          item.id === order.id ? { ...item, status: previousStatus } : item,
        ),
      );
      setMessage(
        error instanceof Error ? error.message : "Unable to update order",
      );
    }
  }

  async function recordManualSale(input: {
    paymentMethod: "ABA" | "WING" | "BANK_TRANSFER" | "CASH" | "OTHER";
    note?: string;
    items: Array<{ productId: string; quantity: number }>;
  }) {
    if (!store) return;
    const order = await createManualSale(store.id, input);
    knownOrderIds.current.add(order.id);
    setOrders((current) => [order, ...current]);
    setRecordingSale(false);
    setMessage(`Walk-in sale #${order.id.slice(-8).toUpperCase()} recorded`);
  }

  async function exportOrders() {
    if (!store) return;
    await exportExcelWorkbook(
      `${store.slug}-orders-${new Date().toISOString().slice(0, 10)}.xlsx`,
      [
        {
          name: "Invoices",
          headers: [
            "Invoice",
            "Source",
            "Table",
            "Status",
            "Payment",
            "Created",
            "Currency",
            "Total",
            "Note",
          ],
          rows: orders.map((order) => [
            order.id,
            order.source,
            order.table?.number ?? "Shared QR",
            order.status,
            order.paymentMethod,
            new Date(order.createdAt),
            order.currency,
            Number(order.subtotal),
            order.note,
          ]),
          dateColumns: [5],
          currencyColumns: [7],
        },
        {
          name: "Items",
          headers: [
            "Invoice",
            "Product",
            "Unit Price",
            "Quantity",
            "Line Total",
            "Currency",
          ],
          rows: orders.flatMap((order) =>
            order.items.map((item) => [
              order.id,
              item.productName,
              Number(item.unitPrice),
              item.quantity,
              Number(item.lineTotal),
              order.currency,
            ]),
          ),
          currencyColumns: [2, 4],
        },
      ],
    );
  }

  if (!store && !loading) {
    return <EmptyState text="No store is assigned to this account." />;
  }

  const storePath = store
    ? getPublicStorePath(store.merchant.slug, store.slug)
    : "";

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-zinc-950 p-5 text-white shadow-sm md:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-white/60">Table service</p>
            <h2 className="mt-1 text-2xl font-semibold">
              {store?.name ?? "Loading store"}
            </h2>
            <p className="mt-2 text-sm text-white/60">
              {
                orders.filter(
                  (order) => !["COMPLETED", "CANCELLED"].includes(order.status),
                ).length
              }{" "}
              active orders · {tables.length} tables
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              className="bg-white text-zinc-950 hover:bg-white/90"
              onClick={() => setRecordingSale(true)}
            >
              <PlusIcon /> Record walk-in sale
            </Button>
            <Button
              className="bg-white text-zinc-950 hover:bg-white/90"
              onClick={() => void enableNotifications()}
            >
              <BellRingIcon />
              {alertsEnabled ? "Test alerts" : "Enable alerts"}
            </Button>
            <Button
              className="bg-white text-zinc-950 hover:bg-white/90"
              disabled={!orders.length}
              onClick={() => void exportOrders()}
            >
              <FileSpreadsheetIcon /> Export Excel
            </Button>
            <Button
              className="bg-white text-zinc-950 hover:bg-white/90"
              onClick={() => void loadData()}
            >
              <RefreshCwIcon /> Refresh
            </Button>
          </div>
        </div>
      </section>

      <div className="flex w-fit rounded-xl bg-muted p-1">
        <ViewButton
          active={view === "orders"}
          onClick={() => setView("orders")}
          icon={ClipboardListIcon}
        >
          Orders
          {unreadOrders ? (
            <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-white">
              {unreadOrders}
            </span>
          ) : null}
        </ViewButton>
        {store?.allowKitchenBoard ? (
          <ViewButton
            active={view === "kitchen"}
            onClick={() => setView("kitchen")}
            icon={CookingPotIcon}
          >
            Kitchen board
          </ViewButton>
        ) : null}
        <ViewButton
          active={view === "tables"}
          onClick={() => setView("tables")}
          icon={TablePropertiesIcon}
        >
          Tables & QR
        </ViewButton>
      </div>

      {message ? (
        <p className="rounded-lg border bg-card px-4 py-3 text-sm">{message}</p>
      ) : null}

      {loading ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Loading table service…
        </p>
      ) : view === "tables" ? (
        <>
          {store?.orderingMode === "SHARED_QR" ? (
            <SharedQrCard
              url={`${origin}${storePath}?token=${encodeURIComponent(store.sharedOrderToken)}`}
            />
          ) : null}
          {store?.allowTableOrdering ? (
            <form
              onSubmit={addTable}
              className="flex max-w-sm gap-2 rounded-xl border bg-card p-4"
            >
              <Input
                name="number"
                type="number"
                min="1"
                step="1"
                placeholder="Table number"
                required
              />
              <Button type="submit">
                <PlusIcon /> Add
              </Button>
            </form>
          ) : null}
          {store?.orderingMode !== "SHARED_QR" && store?.allowTableOrdering ? (
            tables.length ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {tables.map((table) => (
                  <TableQrCard
                    key={table.id}
                    table={table}
                    url={`${origin}${storePath}?table=${table.id}&token=${table.orderToken}`}
                    onDelete={() => void removeTable(table)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState text="Add your first table to generate its ordering QR code." />
            )
          ) : null}
        </>
      ) : view === "kitchen" && store?.allowKitchenBoard ? (
        <KitchenBoard orders={orders} onStatusChange={changeStatus} />
      ) : orders.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onStatusChange={(status) => void changeStatus(order, status)}
            />
          ))}
        </div>
      ) : (
        <EmptyState text="New customer orders will appear here." />
      )}
      {recordingSale && store ? (
        <ManualSaleDialog
          products={products}
          currency={store.currency}
          exchangeRate={Number(store.exchangeRate)}
          onClose={() => setRecordingSale(false)}
          onSave={recordManualSale}
        />
      ) : null}
    </div>
  );
}

function ManualSaleDialog({
  products,
  currency,
  exchangeRate,
  onClose,
  onSave,
}: {
  products: Product[];
  currency: string;
  exchangeRate: number;
  onClose: () => void;
  onSave: (input: {
    paymentMethod: "ABA" | "WING" | "BANK_TRANSFER" | "CASH" | "OTHER";
    note?: string;
    items: Array<{ productId: string; quantity: number }>;
  }) => Promise<void>;
}) {
  const [quantities, setQuantities] = React.useState<Record<string, number>>(
    {},
  );
  const [paymentMethod, setPaymentMethod] = React.useState<
    "ABA" | "WING" | "BANK_TRANSFER" | "CASH" | "OTHER"
  >("CASH");
  const [note, setNote] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const multiplier = currency === "USD" ? 1 : exchangeRate;
  const selected = products.filter((product) => quantities[product.id] > 0);
  const total = selected.reduce(
    (sum, product) =>
      sum + Number(product.price) * multiplier * quantities[product.id],
    0,
  );

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!selected.length) {
      setError("Add at least one product");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave({
        paymentMethod,
        note: note.trim() || undefined,
        items: selected.map((product) => ({
          productId: product.id,
          quantity: quantities[product.id],
        })),
      });
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to record sale",
      );
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-5"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <form
        onSubmit={submit}
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-background shadow-2xl sm:rounded-2xl"
      >
        <header className="flex items-start justify-between border-b p-5">
          <div>
            <p className="text-sm text-muted-foreground">Face-to-face order</p>
            <h2 className="text-xl font-semibold">Record walk-in sale</h2>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose}>
            <XIcon />
          </Button>
        </header>
        <div className="flex-1 overflow-y-auto p-5">
          <div className="space-y-2">
            {products.map((product) => {
              const quantity = quantities[product.id] ?? 0;
              return (
                <div
                  key={product.id}
                  className="flex items-center gap-3 rounded-xl border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {product.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatMoney(
                        String(Number(product.price) * multiplier),
                        currency,
                      )}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    disabled={!quantity}
                    onClick={() =>
                      setQuantities((current) => ({
                        ...current,
                        [product.id]: Math.max(0, quantity - 1),
                      }))
                    }
                  >
                    −
                  </Button>
                  <span className="w-7 text-center text-sm font-semibold">
                    {quantity}
                  </span>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={() =>
                      setQuantities((current) => ({
                        ...current,
                        [product.id]: Math.min(99, quantity + 1),
                      }))
                    }
                  >
                    +
                  </Button>
                </div>
              );
            })}
          </div>
          {!products.length ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Add products before recording a sale.
            </p>
          ) : null}
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-medium">
              Payment method
              <select
                value={paymentMethod}
                onChange={(event) =>
                  setPaymentMethod(event.target.value as typeof paymentMethod)
                }
                className="h-10 rounded-lg border bg-background px-3"
              >
                <option value="CASH">Cash</option>
                <option value="ABA">ABA</option>
                <option value="WING">Wing</option>
                <option value="BANK_TRANSFER">Bank transfer</option>
                <option value="OTHER">Other</option>
              </select>
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              Note
              <Input
                value={note}
                onChange={(event) => setNote(event.target.value)}
                maxLength={500}
                placeholder="Optional sale note"
              />
            </label>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Manual sales use each product&apos;s base menu price and are saved
            as completed.
          </p>
          {error ? (
            <p className="mt-3 text-sm text-destructive">{error}</p>
          ) : null}
        </div>
        <footer className="flex items-center justify-between border-t p-5">
          <div>
            <p className="text-xs text-muted-foreground">
              {selected.length} products selected
            </p>
            <p className="font-semibold">
              {formatMoney(String(total), currency)}
            </p>
          </div>
          <Button type="submit" disabled={saving || !selected.length}>
            {saving ? "Recording…" : "Complete sale"}
          </Button>
        </footer>
      </form>
    </div>
  );
}

function KitchenBoard({
  orders,
  onStatusChange,
}: {
  orders: StoreOrder[];
  onStatusChange: (order: StoreOrder, status: OrderStatus) => Promise<void>;
}) {
  const columns = ORDER_FLOW.slice(0, 4);
  return (
    <div className="grid min-w-0 gap-4 xl:grid-cols-4">
      {columns.map((status) => {
        const columnOrders = orders.filter((order) => order.status === status);
        const nextStatus = ORDER_FLOW[ORDER_FLOW.indexOf(status) + 1];
        return (
          <section
            key={status}
            className="min-w-0 rounded-2xl border bg-muted/35 p-3"
          >
            <header className="mb-3 flex items-center justify-between px-1">
              <h3 className="text-sm font-bold">{formatStatus(status)}</h3>
              <span className="grid size-6 place-items-center rounded-full bg-background text-xs font-bold shadow-sm">
                {columnOrders.length}
              </span>
            </header>
            <div className="space-y-3">
              {columnOrders.map((order) => (
                <article
                  key={order.id}
                  className={`rounded-xl border bg-card p-4 shadow-sm ${
                    status === "PENDING"
                      ? "border-amber-300 ring-2 ring-amber-100"
                      : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-lg font-extrabold">
                        {orderLocation(order)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatElapsed(order.createdAt)}
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold text-muted-foreground">
                      #{order.id.slice(-6).toUpperCase()}
                    </span>
                  </div>
                  <div className="my-3 space-y-2 border-y py-3">
                    {order.items.map((item) => (
                      <div key={item.id} className="text-sm">
                        <p className="font-semibold">
                          {item.quantity} × {item.productName}
                        </p>
                        {item.options.length ? (
                          <p className="text-xs text-muted-foreground">
                            {item.options
                              .map((option) => option.optionName)
                              .join(" · ")}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                  {order.note ? (
                    <p className="mb-3 rounded-lg bg-amber-50 p-2 text-xs font-medium text-amber-900">
                      {order.note}
                    </p>
                  ) : null}
                  {nextStatus ? (
                    <Button
                      className="w-full"
                      size="sm"
                      onClick={() => void onStatusChange(order, nextStatus)}
                    >
                      Move to {formatStatus(nextStatus)}
                    </Button>
                  ) : null}
                </article>
              ))}
              {!columnOrders.length ? (
                <p className="rounded-xl border border-dashed p-5 text-center text-xs text-muted-foreground">
                  No {formatStatus(status).toLowerCase()} orders
                </p>
              ) : null}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function ViewButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
        active ? "bg-background shadow-sm" : "text-muted-foreground"
      }`}
    >
      <Icon className="size-4" /> {children}
    </button>
  );
}

function OrderCard({
  order,
  onStatusChange,
}: {
  order: StoreOrder;
  onStatusChange: (status: OrderStatus) => void;
}) {
  return (
    <article className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Invoice #{order.id.slice(-8).toUpperCase()}
          </p>
          <h3 className="mt-1 text-xl font-semibold">{orderLocation(order)}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {new Date(order.createdAt).toLocaleString()}
            {order.paymentMethod
              ? ` · ${formatPaymentMethod(order.paymentMethod)}`
              : ""}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            order.status === "CANCELLED"
              ? "bg-red-100 text-red-700"
              : order.status === "COMPLETED"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
          }`}
        >
          {order.status}
        </span>
      </div>
      <OrderStatusSlider
        status={order.status}
        onStatusChange={onStatusChange}
      />
      <div className="my-4 border-y py-3">
        {order.items.map((item) => (
          <div
            key={item.id}
            className="flex justify-between gap-4 py-1 text-sm"
          >
            <span>
              {item.quantity} × {item.productName}
              {item.options.length ? (
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {item.options.map((option) => option.optionName).join(" · ")}
                </span>
              ) : null}
            </span>
            <span>{formatMoney(item.lineTotal, order.currency)}</span>
          </div>
        ))}
      </div>
      {order.note ? (
        <p className="mb-3 rounded-lg bg-muted p-3 text-sm">
          Note: {order.note}
        </p>
      ) : null}
      <p className="flex items-center justify-between font-semibold">
        <span className="flex items-center gap-2">
          <ReceiptTextIcon className="size-4" /> Total
        </span>
        {formatMoney(order.subtotal, order.currency)}
      </p>
    </article>
  );
}

function OrderStatusSlider({
  status,
  onStatusChange,
}: {
  status: OrderStatus;
  onStatusChange: (status: OrderStatus) => void;
}) {
  const currentIndex = Math.max(0, ORDER_FLOW.indexOf(status as never));
  const [step, setStep] = React.useState(currentIndex);

  React.useEffect(() => setStep(currentIndex), [currentIndex]);

  function commit() {
    const nextStatus = ORDER_FLOW[step];
    if (nextStatus !== status) onStatusChange(nextStatus);
  }

  if (status === "CANCELLED") {
    return (
      <div className="mt-5 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-3">
        <p className="text-sm font-medium text-red-700">Order cancelled</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onStatusChange("PENDING")}
        >
          Reopen order
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-5 rounded-xl bg-muted/60 p-4">
      <div className="mb-2 grid grid-cols-5 gap-1">
        {ORDER_FLOW.map((flowStatus, index) => (
          <button
            key={flowStatus}
            type="button"
            onClick={() => {
              setStep(index);
              if (flowStatus !== status) onStatusChange(flowStatus);
            }}
            className={`truncate text-center text-[10px] font-semibold sm:text-xs ${
              index <= step ? "text-foreground" : "text-muted-foreground/60"
            }`}
          >
            {formatStatus(flowStatus)}
          </button>
        ))}
      </div>
      <input
        type="range"
        min="0"
        max={ORDER_FLOW.length - 1}
        step="1"
        value={step}
        aria-label="Order progress"
        aria-valuetext={formatStatus(ORDER_FLOW[step])}
        onChange={(event) => setStep(Number(event.target.value))}
        onPointerUp={commit}
        onKeyUp={commit}
        className="h-7 w-full cursor-pointer accent-foreground"
      />
      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Slide or tap a stage to update
        </p>
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Cancel this order?")) {
              onStatusChange("CANCELLED");
            }
          }}
          className="text-xs font-medium text-destructive hover:underline"
        >
          Cancel order
        </button>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <section className="rounded-2xl border border-dashed bg-card p-12 text-center">
      <TablePropertiesIcon className="mx-auto size-9 text-muted-foreground" />
      <p className="mt-3 text-sm text-muted-foreground">{text}</p>
    </section>
  );
}

function formatMoney(value: string, currency: string) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "KHR" ? 0 : 2,
  }).format(Number(value));
}

function formatStatus(status: OrderStatus) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function formatPaymentMethod(value: string) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^\w/, (letter) => letter.toUpperCase());
}

function formatElapsed(value: string) {
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / 60_000),
  );
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min waiting`;
  return `${Math.floor(minutes / 60)} hr ${minutes % 60} min waiting`;
}

function orderLocation(order: StoreOrder) {
  if (order.source === "MANUAL") return "Walk-in sale";
  return order.table ? `Table ${order.table.number}` : "Shared QR";
}

async function playOrderAlert(
  contextRef: React.MutableRefObject<AudioContext | null>,
) {
  try {
    const AudioContextClass =
      window.AudioContext ??
      (
        window as typeof window & {
          webkitAudioContext?: typeof AudioContext;
        }
      ).webkitAudioContext;
    if (!AudioContextClass) return false;
    const context = contextRef.current ?? new AudioContextClass();
    contextRef.current = context;
    if (context.state === "suspended") await context.resume();
    if (context.state !== "running") return false;

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.setValueAtTime(880, context.currentTime);
    oscillator.frequency.setValueAtTime(1_120, context.currentTime + 0.12);
    gain.gain.setValueAtTime(0.22, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.45);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.45);
    return true;
  } catch {
    // Audio alerts are a progressive enhancement.
    return false;
  }
}
