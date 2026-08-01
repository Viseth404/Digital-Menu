"use client";

import * as React from "react";
import {
  Building2Icon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardListIcon,
  FileSpreadsheetIcon,
  SearchIcon,
  StoreIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ORDER_STATUSES } from "@/features/orders/types";
import { exportExcelWorkbook } from "@/lib/excel-export";
import { cn } from "@/lib/utils";
import {
  deleteAdminOrder,
  getAdminOrders,
  updateAdminOrderStatus,
} from "../platform-api";
import type { AdminOrder, AdminOrdersResponse } from "../platform-types";

const EMPTY_RESULT: AdminOrdersResponse = {
  orders: [],
  pagination: { page: 1, pageSize: 25, total: 0, totalPages: 1 },
  filterOptions: { merchants: [] },
};

export function PlatformOrdersManager() {
  const [result, setResult] = React.useState<AdminOrdersResponse>(EMPTY_RESULT);
  const [search, setSearch] = React.useState("");
  const [merchantId, setMerchantId] = React.useState("");
  const [storeId, setStoreId] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [source, setSource] = React.useState("");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [sort, setSort] = React.useState("newest");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);
  const [expandedId, setExpandedId] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [deletingId, setDeletingId] = React.useState("");
  const [message, setMessage] = React.useState("");

  React.useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      getAdminOrders(
        {
          search,
          merchantId,
          storeId,
          status,
          source,
          from,
          to,
          sort,
          page,
          pageSize,
        },
        controller.signal,
      )
        .then((response) => {
          setResult(response);
          setMessage("");
        })
        .catch((error: Error) => {
          if (error.name !== "AbortError") setMessage(error.message);
        })
        .finally(() => setLoading(false));
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [
    from,
    merchantId,
    page,
    pageSize,
    search,
    sort,
    source,
    status,
    storeId,
    to,
  ]);

  const selectedMerchant = result.filterOptions.merchants.find(
    (merchant) => merchant.id === merchantId,
  );
  const activeFilterCount = [
    search,
    merchantId,
    storeId,
    status,
    source,
    from,
    to,
  ].filter(Boolean).length;
  const start = result.pagination.total
    ? (result.pagination.page - 1) * result.pagination.pageSize + 1
    : 0;
  const end = Math.min(
    result.pagination.page * result.pagination.pageSize,
    result.pagination.total,
  );

  function resetPage() {
    setPage(1);
    setExpandedId("");
  }

  function clearFilters() {
    setSearch("");
    setMerchantId("");
    setStoreId("");
    setStatus("");
    setSource("");
    setFrom("");
    setTo("");
    resetPage();
  }

  async function changeStatus(order: AdminOrder, nextStatus: string) {
    const before = order.status;
    setResult((current) => ({
      ...current,
      orders: current.orders.map((item) =>
        item.id === order.id ? { ...item, status: nextStatus } : item,
      ),
    }));
    try {
      const updated = await updateAdminOrderStatus(order.id, nextStatus);
      setResult((current) => ({
        ...current,
        orders: current.orders.map((item) =>
          item.id === updated.id ? updated : item,
        ),
      }));
      setMessage(`Invoice #${shortInvoice(order.id)} updated`);
    } catch (error) {
      setResult((current) => ({
        ...current,
        orders: current.orders.map((item) =>
          item.id === order.id ? { ...item, status: before } : item,
        ),
      }));
      setMessage(
        error instanceof Error ? error.message : "Unable to update invoice",
      );
    }
  }

  async function exportOrders() {
    await exportExcelWorkbook(
      `platform-orders-page-${result.pagination.page}-${new Date().toISOString().slice(0, 10)}.xlsx`,
      [
        {
          name: "Orders",
          headers: [
            "Invoice",
            "Merchant",
            "Store",
            "Source",
            "Table",
            "Status",
            "Payment",
            "Created",
            "Currency",
            "Total",
            "Note",
          ],
          rows: result.orders.map((order) => [
            order.id,
            order.store.merchant.name,
            order.store.name,
            order.source,
            order.table?.number ?? "",
            order.status,
            order.paymentMethod,
            new Date(order.createdAt),
            order.currency,
            Number(order.subtotal),
            order.note,
          ]),
          dateColumns: [7],
          currencyColumns: [9],
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
          rows: result.orders.flatMap((order) =>
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
    const invoiceNumber = shortInvoice(order.id);
    if (
      !window.confirm(
        `Permanently delete invoice #${invoiceNumber} from ${order.store.merchant.name} · ${order.store.name}? This cannot be undone.`,
      )
    ) {
      return;
    }

    setDeletingId(order.id);
    try {
      await deleteAdminOrder(order.id);
      setResult((current) => ({
        ...current,
        orders: current.orders.filter((item) => item.id !== order.id),
        pagination: {
          ...current.pagination,
          total: Math.max(0, current.pagination.total - 1),
        },
      }));
      setExpandedId("");
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
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl bg-zinc-950 p-6 text-white md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm text-white/60">
              <ClipboardListIcon className="size-4" /> Platform invoices
            </p>
            <h2 className="mt-2 text-3xl font-semibold">Order support</h2>
            <p className="mt-2 max-w-2xl text-sm text-white/60">
              Find any order by merchant, store, invoice, or product—then review
              and correct it without losing context.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="min-w-28 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-2xl font-semibold">
                {result.pagination.total.toLocaleString()}
              </p>
              <p className="text-xs text-white/50">Matching orders</p>
            </div>
            <div className="min-w-28 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-2xl font-semibold">
                {result.filterOptions.merchants.length.toLocaleString()}
              </p>
              <p className="text-xs text-white/50">Merchants</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-4 shadow-sm md:p-5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold">Find orders</h3>
            <p className="text-xs text-muted-foreground">
              Start with a merchant to keep every store and invoice clearly
              scoped.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            disabled={!activeFilterCount}
            onClick={clearFilters}
          >
            <XIcon /> Clear {activeFilterCount ? `(${activeFilterCount})` : ""}
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <FilterField label="Search" className="md:col-span-2">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  resetPage();
                }}
                placeholder="Invoice, product, merchant, or store…"
                className="pl-9"
              />
            </div>
          </FilterField>
          <FilterField label="Merchant">
            <select
              value={merchantId}
              onChange={(event) => {
                setMerchantId(event.target.value);
                setStoreId("");
                resetPage();
              }}
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
            >
              <option value="">All merchants</option>
              {result.filterOptions.merchants.map((merchant) => (
                <option key={merchant.id} value={merchant.id}>
                  {merchant.name}
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField label="Store">
            <select
              value={storeId}
              disabled={!merchantId}
              onChange={(event) => {
                setStoreId(event.target.value);
                resetPage();
              }}
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm disabled:opacity-50"
            >
              <option value="">
                {merchantId ? "All stores" : "Select merchant first"}
              </option>
              {selectedMerchant?.stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField label="Status">
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                resetPage();
              }}
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
            >
              <option value="">All statuses</option>
              {ORDER_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {formatLabel(value)}
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField label="Order channel">
            <select
              value={source}
              onChange={(event) => {
                setSource(event.target.value);
                resetPage();
              }}
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
            >
              <option value="">All channels</option>
              <option value="SHARED_QR">Shared QR</option>
              <option value="TABLE_QR">Table QR</option>
              <option value="MANUAL">Manual / walk-in</option>
            </select>
          </FilterField>
          <FilterField label="From date">
            <Input
              type="date"
              value={from}
              onChange={(event) => {
                setFrom(event.target.value);
                resetPage();
              }}
            />
          </FilterField>
          <FilterField label="To date">
            <Input
              type="date"
              value={to}
              onChange={(event) => {
                setTo(event.target.value);
                resetPage();
              }}
            />
          </FilterField>
        </div>

        {selectedMerchant ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
            <Building2Icon className="size-4" />
            <span className="font-semibold">{selectedMerchant.name}</span>
            <span className="text-emerald-700 dark:text-emerald-300">/</span>
            <StoreIcon className="size-4" />
            <span>
              {selectedMerchant.stores.find((store) => store.id === storeId)
                ?.name ?? "All stores"}
            </span>
          </div>
        ) : null}
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {loading
            ? "Loading orders…"
            : `Showing ${start.toLocaleString()}–${end.toLocaleString()} of ${result.pagination.total.toLocaleString()}`}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={sort}
            onChange={(event) => {
              setSort(event.target.value);
              resetPage();
            }}
            aria-label="Sort orders"
            className="h-8 rounded-lg border bg-background px-2 text-xs"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
          <select
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              resetPage();
            }}
            aria-label="Orders per page"
            className="h-8 rounded-lg border bg-background px-2 text-xs"
          >
            <option value="25">25 per page</option>
            <option value="50">50 per page</option>
            <option value="100">100 per page</option>
          </select>
          <Button
            variant="outline"
            disabled={!result.orders.length}
            onClick={() => void exportOrders()}
          >
            <FileSpreadsheetIcon /> Export page
          </Button>
        </div>
      </div>

      {message ? (
        <p className="rounded-xl border bg-card p-3 text-sm">{message}</p>
      ) : null}

      <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        {loading && !result.orders.length ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Loading platform orders…
          </p>
        ) : result.orders.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] text-left text-sm">
              <thead className="border-b bg-muted/45 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Invoice</th>
                  <th className="px-4 py-3 font-medium">Merchant / store</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium">Channel</th>
                  <th className="px-4 py-3 font-medium">Items</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="w-14 px-4 py-3">
                    <span className="sr-only">Details</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {result.orders.map((order) => {
                  const expanded = expandedId === order.id;
                  return (
                    <React.Fragment key={order.id}>
                      <tr
                        className={cn(
                          "align-middle transition-colors hover:bg-muted/30",
                          expanded && "bg-muted/30",
                        )}
                      >
                        <td className="px-4 py-4">
                          <button
                            type="button"
                            className="font-mono text-xs font-semibold hover:underline"
                            onClick={() =>
                              setExpandedId(expanded ? "" : order.id)
                            }
                          >
                            #{shortInvoice(order.id)}
                          </button>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-xs font-semibold text-white">
                              {initials(order.store.merchant.name)}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-semibold">
                                {order.store.merchant.name}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {order.store.name}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-xs text-muted-foreground">
                          {formatDateTime(order.createdAt)}
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-medium">
                            {sourceLabel(order.source)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {adminOrderLocation(order)}
                          </p>
                        </td>
                        <td className="max-w-64 px-4 py-4">
                          <p className="truncate">{orderItemSummary(order)}</p>
                          <p className="text-xs text-muted-foreground">
                            {order.items.reduce(
                              (sum, item) => sum + item.quantity,
                              0,
                            )}{" "}
                            total item(s)
                          </p>
                        </td>
                        <td className="px-4 py-4 text-right font-semibold">
                          {formatMoney(order.subtotal, order.currency)}
                        </td>
                        <td className="px-4 py-4">
                          <select
                            value={order.status}
                            onChange={(event) =>
                              void changeStatus(order, event.target.value)
                            }
                            className={cn(
                              "h-8 rounded-full border px-2 text-xs font-medium",
                              statusClass(order.status),
                            )}
                          >
                            {ORDER_STATUSES.map((value) => (
                              <option key={value} value={value}>
                                {formatLabel(value)}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-4">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`View invoice ${shortInvoice(order.id)} details`}
                            aria-expanded={expanded}
                            onClick={() =>
                              setExpandedId(expanded ? "" : order.id)
                            }
                          >
                            <ChevronDownIcon
                              className={cn(
                                "transition-transform",
                                expanded && "rotate-180",
                              )}
                            />
                          </Button>
                        </td>
                      </tr>
                      {expanded ? (
                        <tr className="bg-muted/20">
                          <td colSpan={8} className="px-4 py-5">
                            <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
                              <div>
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                  Order items
                                </p>
                                <div className="divide-y rounded-xl border bg-background px-4">
                                  {order.items.map((item) => (
                                    <div
                                      key={item.id}
                                      className="flex justify-between gap-4 py-3"
                                    >
                                      <span>
                                        {item.quantity} × {item.productName}
                                      </span>
                                      <span className="font-medium">
                                        {formatMoney(
                                          item.lineTotal,
                                          order.currency,
                                        )}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="space-y-3 rounded-xl border bg-background p-4">
                                <Detail
                                  label="Merchant"
                                  value={order.store.merchant.name}
                                />
                                <Detail
                                  label="Store"
                                  value={order.store.name}
                                />
                                <Detail
                                  label="Payment"
                                  value={
                                    order.paymentMethod
                                      ? formatLabel(order.paymentMethod)
                                      : "Not recorded"
                                  }
                                />
                                <Detail
                                  label="Note"
                                  value={order.note || "No note"}
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  className="mt-2 w-full"
                                  disabled={deletingId === order.id}
                                  onClick={() => void deleteOrder(order)}
                                >
                                  <Trash2Icon />{" "}
                                  {deletingId === order.id
                                    ? "Deleting…"
                                    : "Delete invoice"}
                                </Button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-16 text-center">
            <SearchIcon className="mx-auto size-9 text-muted-foreground" />
            <h3 className="mt-3 font-semibold">No orders found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Try another merchant, date range, or search term.
            </p>
            {activeFilterCount ? (
              <Button variant="outline" className="mt-4" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : null}
          </div>
        )}
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Page {result.pagination.page} of {result.pagination.totalPages}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            disabled={loading || page <= 1}
            onClick={() => {
              setPage((current) => Math.max(1, current - 1));
              setExpandedId("");
            }}
          >
            <ChevronLeftIcon /> Previous
          </Button>
          <Button
            variant="outline"
            disabled={loading || page >= result.pagination.totalPages}
            onClick={() => {
              setPage((current) => current + 1);
              setExpandedId("");
            }}
          >
            Next <ChevronRightIcon />
          </Button>
        </div>
      </div>
    </div>
  );
}

function FilterField({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label
      className={cn(
        "grid gap-1.5 text-xs font-medium text-muted-foreground",
        className,
      )}
    >
      <span>{label}</span>
      {children}
    </label>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}

function shortInvoice(id: string) {
  return id.slice(-8).toUpperCase();
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatLabel(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase().replaceAll("_", " ");
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function sourceLabel(source: AdminOrder["source"]) {
  if (source === "MANUAL") return "Manual";
  if (source === "TABLE_QR") return "Table QR";
  return "Shared QR";
}

function adminOrderLocation(order: AdminOrder) {
  if (order.source === "MANUAL") return "Walk-in sale";
  return order.table ? `Table ${order.table.number}` : "One shared code";
}

function orderItemSummary(order: AdminOrder) {
  const visible = order.items
    .slice(0, 2)
    .map((item) => `${item.quantity}× ${item.productName}`);
  const remaining = order.items.length - visible.length;
  return `${visible.join(", ")}${remaining > 0 ? ` +${remaining} more` : ""}`;
}

function statusClass(status: string) {
  if (status === "COMPLETED")
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "CANCELLED") return "border-red-200 bg-red-50 text-red-800";
  if (status === "READY") return "border-blue-200 bg-blue-50 text-blue-800";
  return "border-amber-200 bg-amber-50 text-amber-900";
}

function formatMoney(value: string, currency: string) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "KHR" ? 0 : 2,
  }).format(Number(value));
}
