"use client";

import * as React from "react";
import type { Store } from "@/features/stores/types";
import type { SalesReport } from "../types";

type ReportExportDocumentProps = {
  store: Store;
  report: SalesReport;
};

export const ReportExportDocument = React.forwardRef<
  HTMLDivElement,
  ReportExportDocumentProps
>(function ReportExportDocument({ store, report }, ref) {
  const period =
    report.range.from === report.range.to
      ? report.range.from
      : `${report.range.from} to ${report.range.to}`;
  const pendingCount =
    (report.statusCounts.PENDING ?? 0) +
    (report.statusCounts.CONFIRMED ?? 0) +
    (report.statusCounts.PREPARING ?? 0) +
    (report.statusCounts.READY ?? 0);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: 794,
        minHeight: 1123,
        padding: "48px 52px 36px",
        background: "#f7f5f0",
        color: "#18181b",
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        zIndex: -9999,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "0 0 auto",
          height: 7,
          background: store.primaryColor,
        }}
      />

      <header
        style={{
          display: "flex",
          alignItems: "center",
          paddingBottom: 22,
          borderBottom: "1px solid #d8d2c7",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              width: 64,
              height: 64,
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              border: "1px solid #ded9cf",
              borderRadius: 16,
              background: "#ffffff",
              color: store.primaryColor,
              fontSize: 24,
              fontWeight: 800,
            }}
          >
            {store.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={store.logoUrl}
                alt={`${store.name} logo`}
                crossOrigin="anonymous"
                style={{
                  width: "100%",
                  height: "100%",
                  padding: 6,
                  objectFit: "contain",
                }}
              />
            ) : (
              store.name.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 24,
                lineHeight: 1.15,
                fontWeight: 750,
              }}
            >
              {store.name}
            </h1>
            <p
              style={{
                margin: "6px 0 0",
                color: "#71717a",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 1.2,
                textTransform: "uppercase",
              }}
            >
              Sales report · {period}
            </p>
          </div>
        </div>
      </header>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          marginTop: 26,
        }}
      >
        <ExportMetric
          label="Orders"
          value={String(report.summary.orderCount)}
        />
        <ExportMetric
          label="Completed sales"
          value={formatMoney(report.summary.total, report.summary.currency)}
          accent
        />
        <ExportMetric
          label="Average invoice"
          value={formatMoney(
            report.summary.averageOrder,
            report.summary.currency,
          )}
        />
        <ExportMetric
          label="Reporting period"
          value={`${report.range.dayCount} ${report.range.dayCount === 1 ? "day" : "days"}`}
        />
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "150px 1fr",
          alignItems: "center",
          gap: 24,
          marginTop: 18,
          padding: "16px 22px",
          border: "1px solid #ded9cf",
          borderRadius: 12,
          background: "#ffffff",
        }}
      >
        <StatusDonut
          completed={report.summary.completedCount}
          inProgress={pendingCount}
          cancelled={report.summary.cancelledCount}
        />
        <div>
          <p
            style={{
              margin: 0,
              color: "#71717a",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: 0.8,
              textTransform: "uppercase",
            }}
          >
            Order status
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12,
              marginTop: 14,
            }}
          >
            <StatusLegend
              label="Completed"
              value={report.summary.completedCount}
              color="#15803d"
            />
            <StatusLegend
              label="In progress"
              value={pendingCount}
              color="#ca8a04"
            />
            <StatusLegend
              label="Cancelled"
              value={report.summary.cancelledCount}
              color="#dc2626"
            />
          </div>
        </div>
      </section>

      <section style={{ marginTop: 30 }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 20,
            marginBottom: 12,
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 750 }}>
              Invoice overview
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: 11, color: "#71717a" }}>
              Latest invoices from page {report.pagination.page} of{" "}
              {report.pagination.totalPages}
            </p>
          </div>
          <p style={{ margin: 0, fontSize: 11, color: "#71717a" }}>
            {report.pagination.totalItems} total invoices
          </p>
        </div>

        <table
          style={{
            width: "100%",
            borderCollapse: "separate",
            borderSpacing: 0,
            overflow: "hidden",
            border: "1px solid #ded9cf",
            borderRadius: 12,
            background: "#ffffff",
            fontSize: 11,
          }}
        >
          <thead>
            <tr style={{ background: "#202024", color: "#ffffff" }}>
              <ExportHead align="left">Invoice</ExportHead>
              <ExportHead align="left">Date</ExportHead>
              <ExportHead align="left">Items</ExportHead>
              <ExportHead align="left">Status</ExportHead>
              <ExportHead align="right">Total</ExportHead>
            </tr>
          </thead>
          <tbody>
            {report.orders.map((order, index) => (
              <tr
                key={order.id}
                style={{ background: index % 2 ? "#faf9f6" : "#ffffff" }}
              >
                <ExportCell>
                  <span style={{ fontWeight: 700 }}>
                    #{order.id.slice(-8).toUpperCase()}
                  </span>
                </ExportCell>
                <ExportCell>
                  {new Intl.DateTimeFormat("en", {
                    month: "short",
                    day: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: report.range.timeZone,
                  }).format(new Date(order.createdAt))}
                </ExportCell>
                <ExportCell>{orderItemSummary(order)}</ExportCell>
                <ExportCell>{formatLabel(order.status)}</ExportCell>
                <ExportCell align="right">
                  <span style={{ fontWeight: 700 }}>
                    {formatMoney(order.subtotal, order.currency)}
                  </span>
                </ExportCell>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <footer
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 30,
          paddingTop: 16,
          borderTop: "1px solid #d8d2c7",
          color: "#71717a",
          fontSize: 10,
        }}
      >
        <span>Generated by TeamOne Digital-Menu</span>
        <span>{report.range.timeZone}</span>
      </footer>
    </div>
  );
});

function ExportMetric({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        minHeight: 92,
        padding: "15px 14px",
        border: accent ? "1px solid #c49a45" : "1px solid #ded9cf",
        borderRadius: 12,
        background: accent ? "#fff9e9" : "#ffffff",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: 0.7,
          textTransform: "uppercase",
          color: "#71717a",
        }}
      >
        {label}
      </p>
      <p
        style={{
          margin: "12px 0 0",
          fontSize: 18,
          lineHeight: 1.15,
          fontWeight: 750,
          color: accent ? "#8a6426" : "#18181b",
        }}
      >
        {value}
      </p>
    </div>
  );
}

function StatusDonut({
  completed,
  inProgress,
  cancelled,
}: {
  completed: number;
  inProgress: number;
  cancelled: number;
}) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const segments = [
    { value: completed, color: "#15803d" },
    { value: inProgress, color: "#ca8a04" },
    { value: cancelled, color: "#dc2626" },
  ];
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  let offset = 0;

  return (
    <svg
      aria-hidden="true"
      width="132"
      height="132"
      viewBox="0 0 120 120"
      style={{ display: "block" }}
    >
      <circle
        cx="60"
        cy="60"
        r={radius}
        fill="none"
        stroke="#ebe7df"
        strokeWidth="14"
      />
      {segments.map((segment) => {
        const length = total ? (segment.value / total) * circumference : 0;
        const dashOffset = -offset;
        offset += length;

        return segment.value ? (
          <circle
            key={segment.color}
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={segment.color}
            strokeWidth="14"
            strokeDasharray={`${length} ${circumference - length}`}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 60 60)"
          />
        ) : null;
      })}
      <text
        x="60"
        y="57"
        textAnchor="middle"
        fill="#18181b"
        fontSize="20"
        fontWeight="750"
      >
        {total}
      </text>
      <text
        x="60"
        y="72"
        textAnchor="middle"
        fill="#71717a"
        fontSize="8"
        fontWeight="700"
        letterSpacing="0.8"
      >
        ORDERS
      </text>
    </svg>
  );
}

function StatusLegend({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span
          style={{
            width: 8,
            height: 8,
            flexShrink: 0,
            borderRadius: 999,
            background: color,
          }}
        />
        <span style={{ color: "#71717a", fontSize: 10 }}>{label}</span>
      </div>
      <p
        style={{
          margin: "7px 0 0 15px",
          color: "#18181b",
          fontSize: 18,
          fontWeight: 750,
        }}
      >
        {value}
      </p>
    </div>
  );
}

function ExportHead({
  children,
  align,
}: {
  children: React.ReactNode;
  align: "left" | "right";
}) {
  return (
    <th
      style={{
        padding: "10px 12px",
        textAlign: align,
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: 0.6,
        textTransform: "uppercase",
      }}
    >
      {children}
    </th>
  );
}

function ExportCell({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <td
      style={{
        height: 43,
        padding: "8px 12px",
        borderTop: "1px solid #ebe7df",
        textAlign: align,
        color: "#3f3f46",
      }}
    >
      {children}
    </td>
  );
}

function formatMoney(value: string, currency: string) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "KHR" ? 0 : 2,
  }).format(Number(value));
}

function formatLabel(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase().replaceAll("_", " ");
}

function orderItemSummary(order: SalesReport["orders"][number]) {
  const items = order.items.map(
    (item) => `${item.quantity}× ${item.productName}`,
  );
  if (!items.length) return "No items";
  if (items.length <= 2) return items.join(" · ");
  return `${items.slice(0, 2).join(" · ")} +${items.length - 2} more`;
}
