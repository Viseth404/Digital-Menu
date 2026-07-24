"use client";

import * as React from "react";
import {
  ChartNoAxesCombinedIcon,
  CheckCircle2Icon,
  CircleDollarSignIcon,
  Clock3Icon,
  PackageOpenIcon,
  ReceiptTextIcon,
  StoreIcon,
  TablePropertiesIcon,
  TagsIcon,
  TrendingUpIcon,
} from "lucide-react";
import { getMerchantStores } from "@/features/stores/stores-api";
import { getStoreAnalytics } from "../dashboard-api";
import type { AnalyticsRange, StoreAnalytics } from "../types";

const RANGE_OPTIONS: AnalyticsRange[] = [7, 30];

export function StoreAnalyticsDashboard() {
  const [range, setRange] = React.useState<AnalyticsRange>(7);
  const [storeId, setStoreId] = React.useState("");
  const [analytics, setAnalytics] = React.useState<StoreAnalytics | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [message, setMessage] = React.useState("");

  React.useEffect(() => {
    getMerchantStores()
      .then((stores) => setStoreId(stores[0]?.id ?? ""))
      .catch((error: Error) => {
        setMessage(error.message);
        setLoading(false);
      });
  }, []);

  React.useEffect(() => {
    if (!storeId) return;
    const controller = new AbortController();
    setLoading(true);
    getStoreAnalytics(storeId, range, controller.signal)
      .then(setAnalytics)
      .catch((error: Error) => {
        if (error.name !== "AbortError") setMessage(error.message);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [range, storeId]);

  if (loading && !analytics) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        Loading store analytics…
      </p>
    );
  }
  if (!analytics) {
    return (
      <section className="rounded-2xl border border-dashed p-12 text-center">
        <StoreIcon className="mx-auto size-9 text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">
          {message || "No store analytics are available."}
        </p>
      </section>
    );
  }

  const { store, summary } = analytics;
  const stats = [
    {
      label: "Sales revenue",
      value: formatMoney(summary.revenue, store.currency),
      detail: `${summary.completedOrders} completed invoices`,
      icon: CircleDollarSignIcon,
    },
    {
      label: "Today’s sales",
      value: formatMoney(summary.todayRevenue, store.currency),
      detail: "Completed today",
      icon: TrendingUpIcon,
    },
    {
      label: "Average invoice",
      value: formatMoney(summary.averageOrder, store.currency),
      detail: `${summary.totalOrders} total orders`,
      icon: ReceiptTextIcon,
    },
    {
      label: "Active orders",
      value: String(summary.activeOrders),
      detail: "Needs restaurant attention",
      icon: Clock3Icon,
    },
  ];

  return (
    <div className="min-w-0 space-y-6">
      <section className="overflow-hidden rounded-2xl border bg-zinc-950 p-6 text-white shadow-sm md:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-white/60">
              <ChartNoAxesCombinedIcon className="size-4" />
              Restaurant performance
            </div>
            <h2 className="mt-2 text-3xl font-semibold">{store.name}</h2>
            <p className="mt-2 text-sm text-white/60">
              Live sales, ordering, and catalog information
            </p>
          </div>
          <div className="flex rounded-xl bg-white/10 p-1">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setRange(option)}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  range === option ? "bg-white text-zinc-950" : "text-white/60"
                }`}
              >
                {option} days
              </button>
            ))}
          </div>
        </div>
      </section>

      {message ? (
        <p className="rounded-lg border bg-card p-3 text-sm">{message}</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, detail, icon: Icon }) => (
          <article
            key={label}
            className="rounded-2xl border bg-card p-5 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <p className="text-sm text-muted-foreground">{label}</p>
              <span className="grid size-9 place-items-center rounded-xl bg-muted">
                <Icon className="size-4" />
              </span>
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight">
              {value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
          </article>
        ))}
      </div>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <SalesTrend analytics={analytics} />
        <StoreHealth analytics={analytics} />
      </div>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <TopItems analytics={analytics} />
        <RecentInvoices analytics={analytics} />
      </div>
    </div>
  );
}

function SalesTrend({ analytics }: { analytics: StoreAnalytics }) {
  const maximum = Math.max(...analytics.trend.map((point) => point.revenue), 1);
  const isMonthlyRange = analytics.trend.length > 7;

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border bg-card p-4 shadow-sm sm:p-5 md:p-6">
      <div>
        <h3 className="font-semibold">Sales trend</h3>
        <p className="text-sm text-muted-foreground">
          Completed invoice revenue by day
        </p>
      </div>
      <div
        className="mt-6 flex h-56 min-w-0 items-end gap-1 sm:gap-1.5 md:gap-2"
        role="img"
        aria-label={`${analytics.trend.length}-day sales revenue chart`}
      >
        {analytics.trend.map((point, index) => {
          const height = point.revenue
            ? Math.max(8, (point.revenue / maximum) * 100)
            : 2;
          const showMonthlyLabel =
            !isMonthlyRange ||
            index === 0 ||
            index === analytics.trend.length - 1 ||
            index % 5 === 0;

          return (
            <div
              key={point.date}
              className="group flex h-full min-w-0 flex-1 basis-0 flex-col justify-end"
            >
              <div className="relative flex flex-1 items-end">
                <div
                  className="w-full min-w-px rounded-t-sm bg-zinc-900 transition-colors hover:bg-zinc-700 motion-reduce:transition-none sm:rounded-t-md"
                  style={{ height: `${height}%` }}
                  title={`${formatDate(point.date)}: ${formatMoney(
                    point.revenue,
                    analytics.store.currency,
                  )}, ${point.orders} orders`}
                />
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-zinc-950 px-2 py-1 text-xs text-white shadow-lg group-hover:block">
                  {formatMoney(point.revenue, analytics.store.currency)} ·{" "}
                  {point.orders} orders
                </div>
              </div>
              <p
                className={`mt-2 h-4 truncate text-center text-[9px] text-muted-foreground sm:text-[10px] ${
                  showMonthlyLabel ? "" : "invisible"
                }`}
                aria-hidden={!showMonthlyLabel}
              >
                {showMonthlyLabel ? formatChartDate(point.date) : ""}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function StoreHealth({ analytics }: { analytics: StoreAnalytics }) {
  const { store, statuses } = analytics;
  const details = [
    { label: "Products", value: store.productCount, icon: PackageOpenIcon },
    { label: "Categories", value: store.categoryCount, icon: TagsIcon },
    {
      label: "Dining tables",
      value: store.tableCount,
      icon: TablePropertiesIcon,
    },
  ];

  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold">Store health</h3>
          <p className="text-sm text-muted-foreground">
            Catalog and order status
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            store.isPublished
              ? "bg-emerald-100 text-emerald-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          {store.isPublished ? "Published" : "Draft"}
        </span>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2">
        {details.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl bg-muted/60 p-3">
            <Icon className="size-4 text-muted-foreground" />
            <p className="mt-2 text-xl font-semibold">{value}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {label}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-5">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Order status
        </p>
        <div className="flex flex-wrap gap-2">
          {statuses.length ? (
            statuses.map(({ status, count }) => (
              <span
                key={status}
                className="rounded-full border px-2.5 py-1 text-xs"
              >
                {formatLabel(status)} · {count}
              </span>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">
              No orders in this period
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

function TopItems({ analytics }: { analytics: StoreAnalytics }) {
  const maximum = Math.max(
    ...analytics.topItems.map((item) => item.quantity),
    1,
  );
  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
      <h3 className="font-semibold">Top-selling items</h3>
      <p className="text-sm text-muted-foreground">
        Ranked by completed quantity
      </p>
      <div className="mt-5 space-y-4">
        {analytics.topItems.length ? (
          analytics.topItems.map((item, index) => (
            <div key={item.name}>
              <div className="mb-1.5 flex justify-between gap-3 text-sm">
                <span className="truncate font-medium">
                  {index + 1}. {item.name}
                </span>
                <span className="shrink-0 text-muted-foreground">
                  {item.quantity} sold
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-zinc-900"
                  style={{ width: `${(item.quantity / maximum) * 100}%` }}
                />
              </div>
            </div>
          ))
        ) : (
          <EmptyData text="Complete orders to see top-selling items." />
        )}
      </div>
    </section>
  );
}

function RecentInvoices({ analytics }: { analytics: StoreAnalytics }) {
  return (
    <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="p-5 md:p-6">
        <h3 className="font-semibold">Recent invoices</h3>
        <p className="text-sm text-muted-foreground">
          Latest table orders in this period
        </p>
      </div>
      {analytics.recentOrders.length ? (
        <div className="divide-y border-t">
          {analytics.recentOrders.map((order) => (
            <div key={order.id} className="flex items-center gap-3 px-5 py-3">
              <span className="grid size-9 place-items-center rounded-xl bg-muted">
                <ReceiptTextIcon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  Table {order.tableNumber} · #
                  {order.id.slice(-6).toUpperCase()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(order.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">
                  {formatMoney(order.total, analytics.store.currency)}
                </p>
                <p className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                  {order.status === "COMPLETED" ? (
                    <CheckCircle2Icon className="size-3 text-emerald-500" />
                  ) : null}
                  {formatLabel(order.status)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyData text="No invoices in this period." />
      )}
    </section>
  );
}

function EmptyData({ text }: { text: string }) {
  return (
    <p className="p-6 text-center text-sm text-muted-foreground">{text}</p>
  );
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "KHR" ? 0 : 2,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function formatChartDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "numeric",
    day: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function formatLabel(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase().replaceAll("_", " ");
}
