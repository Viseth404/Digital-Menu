"use client";

import * as React from "react";
import {
  ClipboardListIcon,
  FileSpreadsheetIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ORDER_STATUSES } from "@/features/orders/types";
import { exportExcelWorkbook } from "@/lib/excel-export";
import {
  deleteAdminOrder,
  getAdminOrders,
  updateAdminOrderStatus,
} from "../platform-api";
import type { AdminOrder } from "../platform-types";

export function PlatformOrdersManager() {
  const [orders, setOrders] = React.useState<AdminOrder[]>([]);
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [deletingId, setDeletingId] = React.useState("");
  const [message, setMessage] = React.useState("");

  React.useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      getAdminOrders({ search, status, from, to }, controller.signal)
        .then(setOrders)
        .catch((error: Error) => {
          if (error.name !== "AbortError") setMessage(error.message);
        })
        .finally(() => setLoading(false));
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [from, search, status, to]);

  async function changeStatus(order: AdminOrder, nextStatus: string) {
    const before = order.status;
    setOrders((current) =>
      current.map((item) =>
        item.id === order.id ? { ...item, status: nextStatus } : item,
      ),
    );
    try {
      const updated = await updateAdminOrderStatus(order.id, nextStatus);
      setOrders((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setMessage(`Invoice #${order.id.slice(-8).toUpperCase()} updated`);
    } catch (error) {
      setOrders((current) =>
        current.map((item) =>
          item.id === order.id ? { ...item, status: before } : item,
        ),
      );
      setMessage(
        error instanceof Error ? error.message : "Unable to update invoice",
      );
    }
  }

  async function exportOrders() {
    await exportExcelWorkbook(
      `platform-orders-${new Date().toISOString().slice(0, 10)}.xlsx`,
      [
        {
          name: "Orders",
          headers: [
            "Invoice",
            "Merchant",
            "Store",
            "Table",
            "Status",
            "Created",
            "Currency",
            "Total",
            "Note",
          ],
          rows: orders.map((order) => [
            order.id,
            order.store.merchant.name,
            order.store.name,
            order.table.number,
            order.status,
            new Date(order.createdAt),
            order.currency,
            Number(order.subtotal),
            order.note,
          ]),
          dateColumns: [5],
          currencyColumns: [7],
        },
        {
          name: "Order Items",
          headers: [
            "Invoice",
            "Merchant",
            "Store",
            "Product",
            "Quantity",
            "Line Total",
            "Currency",
          ],
          rows: orders.flatMap((order) =>
            order.items.map((item) => [
              order.id,
              order.store.merchant.name,
              order.store.name,
              item.productName,
              item.quantity,
              Number(item.lineTotal),
              order.currency,
            ]),
          ),
          currencyColumns: [5],
        },
      ],
    );
  }

  async function deleteOrder(order: AdminOrder) {
    const invoiceNumber = order.id.slice(-8).toUpperCase();
    if (
      !window.confirm(
        `Permanently delete invoice #${invoiceNumber}? This removes the invoice and all of its line items and cannot be undone.`,
      )
    ) {
      return;
    }

    setDeletingId(order.id);
    try {
      await deleteAdminOrder(order.id);
      setOrders((current) => current.filter((item) => item.id !== order.id));
      setMessage(`Invoice #${invoiceNumber} deleted`);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to delete invoice",
      );
    } finally {
      setDeletingId("");
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-zinc-950 p-6 text-white md:p-8">
        <p className="flex items-center gap-2 text-sm text-white/60">
          <ClipboardListIcon className="size-4" /> Platform invoices
        </p>
        <h2 className="mt-2 text-3xl font-semibold">Order support</h2>
        <p className="mt-2 text-sm text-white/60">
          Search and correct invoices across every merchant.
        </p>
      </section>

      <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto_auto]">
        <label className="relative">
          <SearchIcon className="absolute left-3 top-3 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Invoice ID, store, or merchant…"
            className="pl-9"
          />
        </label>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="h-10 rounded-lg border bg-background px-3 text-sm"
        >
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((value) => (
            <option key={value} value={value}>
              {formatLabel(value)}
            </option>
          ))}
        </select>
        <Input
          type="date"
          value={from}
          onChange={(event) => setFrom(event.target.value)}
          aria-label="Orders from date"
        />
        <Input
          type="date"
          value={to}
          onChange={(event) => setTo(event.target.value)}
          aria-label="Orders to date"
        />
        <Button
          variant="outline"
          disabled={!orders.length}
          onClick={() => void exportOrders()}
        >
          <FileSpreadsheetIcon /> Export Excel
        </Button>
      </div>

      {message ? (
        <p className="rounded-xl border bg-card p-3 text-sm">{message}</p>
      ) : null}
      {loading ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Loading platform orders…
        </p>
      ) : orders.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {orders.map((order) => (
            <article
              key={order.id}
              className="rounded-2xl border bg-card p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Invoice #{order.id.slice(-8).toUpperCase()}
                  </p>
                  <h3 className="mt-1 font-semibold">
                    {order.store.merchant.name} · {order.store.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Table {order.table.number} ·{" "}
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
                <select
                  value={order.status}
                  onChange={(event) =>
                    void changeStatus(order, event.target.value)
                  }
                  className="h-9 rounded-lg border bg-background px-2 text-xs"
                >
                  {ORDER_STATUSES.map((value) => (
                    <option key={value} value={value}>
                      {formatLabel(value)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="my-4 divide-y border-y py-2">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between gap-3 py-2 text-sm"
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
              <div className="flex items-center justify-between gap-4">
                <p className="flex flex-1 justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatMoney(order.subtotal, order.currency)}</span>
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={deletingId === order.id}
                  onClick={() => void deleteOrder(order)}
                  aria-label={`Delete invoice ${order.id.slice(-8).toUpperCase()}`}
                >
                  <Trash2Icon />
                  {deletingId === order.id ? "Deleting…" : "Delete"}
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          No invoices match these filters.
        </p>
      )}
    </div>
  );
}

function formatLabel(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase().replaceAll("_", " ");
}

function formatMoney(value: string, currency: string) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "KHR" ? 0 : 2,
  }).format(Number(value));
}
