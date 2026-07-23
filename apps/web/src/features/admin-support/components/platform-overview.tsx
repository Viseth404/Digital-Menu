"use client";

import * as React from "react";
import Link from "next/link";
import {
  ActivityIcon,
  Building2Icon,
  ClipboardListIcon,
  ShieldCheckIcon,
  StoreIcon,
  UsersIcon,
} from "lucide-react";
import { appConfig } from "@/config/app-config";
import { getPlatformOverview } from "../platform-api";
import type { PlatformOverview } from "../platform-types";

export function PlatformOverviewDashboard() {
  const [data, setData] = React.useState<PlatformOverview | null>(null);
  const [message, setMessage] = React.useState("");

  React.useEffect(() => {
    const controller = new AbortController();
    getPlatformOverview(controller.signal)
      .then(setData)
      .catch((error: Error) => setMessage(error.message));
    return () => controller.abort();
  }, []);

  if (!data) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        {message || "Loading platform analytics…"}
      </p>
    );
  }

  const cards = [
    {
      label: "Merchants",
      value: data.merchants.total,
      detail: `${data.merchants.active} active · ${data.merchants.pending} pending`,
      icon: Building2Icon,
      href: appConfig.routes.adminMerchants,
    },
    {
      label: "Stores",
      value: data.stores.total,
      detail: `${data.stores.published} published · ${data.stores.inactive} inactive`,
      icon: StoreIcon,
      href: appConfig.routes.adminMerchants,
    },
    {
      label: "Platform users",
      value: data.users.total,
      detail: `${data.users.active} active · ${data.users.disabled} disabled`,
      icon: UsersIcon,
      href: appConfig.routes.adminUsers,
    },
    {
      label: "Active orders",
      value: data.orders.active,
      detail: `${data.orders.completed} completed · ${data.orders.cancelled} cancelled`,
      icon: ClipboardListIcon,
      href: appConfig.routes.adminOrders,
    },
  ];
  const maxOrders = Math.max(...data.trend.map((point) => point.orders), 1);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-zinc-950 p-6 text-white md:p-8">
        <p className="flex items-center gap-2 text-sm text-white/60">
          <ShieldCheckIcon className="size-4" /> Platform operations
        </p>
        <h2 className="mt-2 text-3xl font-semibold">
          Administrator control center
        </h2>
        <p className="mt-2 text-sm text-white/60">
          Live merchant, store, user, order, and support activity.
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, detail, icon: Icon, href }) => (
          <Link
            key={label}
            href={href}
            className="rounded-2xl border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex justify-between">
              <p className="text-sm text-muted-foreground">{label}</p>
              <Icon className="size-4" />
            </div>
            <p className="mt-3 text-3xl font-semibold">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
          <h3 className="flex items-center gap-2 font-semibold">
            <ActivityIcon className="size-4" /> Platform order trend
          </h3>
          <p className="text-sm text-muted-foreground">
            All orders during the last 30 days
          </p>
          <div className="mt-6 flex h-52 items-end gap-1">
            {data.trend.map((point) => (
              <div
                key={point.date}
                className="group relative flex h-full flex-1 items-end"
              >
                <div
                  className="w-full rounded-t bg-zinc-900"
                  style={{
                    height: `${point.orders ? Math.max(5, (point.orders / maxOrders) * 100) : 1}%`,
                  }}
                />
                <span className="absolute bottom-full left-1/2 mb-1 hidden -translate-x-1/2 rounded bg-zinc-950 px-2 py-1 text-xs text-white group-hover:block">
                  {point.orders}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
          <h3 className="font-semibold">Recent administrator activity</h3>
          <div className="mt-3 space-y-3">
            {data.recentActivity.slice(0, 5).map((entry) => (
              <div key={entry.id} className="text-sm">
                <p className="font-medium">
                  {formatLabel(entry.action)} ·{" "}
                  {entry.targetName ?? entry.targetType}
                </p>
                <p className="text-xs text-muted-foreground">
                  {entry.adminName} ·{" "}
                  {new Date(entry.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function formatLabel(value: string) {
  return value.toLowerCase().replaceAll("_", " ");
}
