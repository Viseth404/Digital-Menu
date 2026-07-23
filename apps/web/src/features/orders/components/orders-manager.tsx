"use client";

import * as React from "react";
import {
  ClipboardListIcon,
  FileSpreadsheetIcon,
  PlusIcon,
  RefreshCwIcon,
  ReceiptTextIcon,
  TablePropertiesIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getPublicStorePath } from "@/config/app-config";
import { exportExcelWorkbook } from "@/lib/excel-export";
import { getMerchantStores } from "@/features/stores/stores-api";
import type { Store } from "@/features/stores/types";
import {
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
import { TableQrCard } from "./table-qr-card";

type View = "orders" | "tables";

export function OrdersManager() {
  const [store, setStore] = React.useState<Store | null>(null);
  const [orders, setOrders] = React.useState<StoreOrder[]>([]);
  const [tables, setTables] = React.useState<DiningTable[]>([]);
  const [view, setView] = React.useState<View>("orders");
  const [loading, setLoading] = React.useState(true);
  const [message, setMessage] = React.useState("");
  const [origin, setOrigin] = React.useState("");

  React.useEffect(() => setOrigin(window.location.origin), []);
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
      const [tableData, orderData] = await Promise.all([
        getStoreTables(store.id),
        getStoreOrders(store.id),
      ]);
      setTables(tableData);
      setOrders(orderData);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load");
    } finally {
      setLoading(false);
    }
  }, [store]);

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

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

  async function exportOrders() {
    if (!store) return;
    await exportExcelWorkbook(
      `${store.slug}-orders-${new Date().toISOString().slice(0, 10)}.xlsx`,
      [
        {
          name: "Invoices",
          headers: [
            "Invoice",
            "Table",
            "Status",
            "Created",
            "Currency",
            "Total",
            "Note",
          ],
          rows: orders.map((order) => [
            order.id,
            order.table.number,
            order.status,
            new Date(order.createdAt),
            order.currency,
            Number(order.subtotal),
            order.note,
          ]),
          dateColumns: [3],
          currencyColumns: [5],
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
        </ViewButton>
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
          {tables.length ? (
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
          )}
        </>
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
          <h3 className="mt-1 text-xl font-semibold">
            Table {order.table.number}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {new Date(order.createdAt).toLocaleString()}
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
