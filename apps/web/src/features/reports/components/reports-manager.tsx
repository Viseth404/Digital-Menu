"use client";

import * as React from "react";
import Link from "next/link";
import {
  CalendarDaysIcon,
  CheckCircle2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  FileImageIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  ListFilterIcon,
  LockKeyholeIcon,
  ReceiptTextIcon,
  RefreshCwIcon,
  SendIcon,
  StoreIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { exportExcelWorkbook } from "@/lib/excel-export";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import type { StoreOrder } from "@/features/orders/types";
import { getMerchantStores } from "@/features/stores/stores-api";
import type { Store } from "@/features/stores/types";
import { closeSalesReport, getSalesReport } from "../reports-api";
import type { SalesReport } from "../types";
import { ReportExportDocument } from "./report-export-document";

type Preset =
  "today" | "yesterday" | "this_month" | "last_month" | "last_week" | "custom";

const presetLabels: Record<Preset, string> = {
  today: "Today",
  yesterday: "Yesterday",
  this_month: "This month",
  last_month: "Last month",
  last_week: "Last week",
  custom: "Select dates",
};

export function ReportsManager() {
  const [selectedStore, setSelectedStore] = React.useState<Store | null>(null);
  const [preset, setPreset] = React.useState<Preset>("today");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [report, setReport] = React.useState<SalesReport | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [closing, setClosing] = React.useState(false);
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [exporting, setExporting] = React.useState<"pdf" | "png" | null>(null);
  const exportDocumentRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const controller = new AbortController();
    getMerchantStores({ signal: controller.signal })
      .then((data) => {
        const requestedStoreId = new URLSearchParams(
          window.location.search,
        ).get("store");
        setSelectedStore(
          data.find((store) => store.id === requestedStoreId) ??
            data[0] ??
            null,
        );
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== "AbortError") {
          showErrorToast("Unable to load stores", error.message);
        }
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  React.useEffect(() => {
    if (!selectedStore) return;
    const query = new URLSearchParams(window.location.search);
    const queryFrom = query.get("from");
    const queryTo = query.get("to");
    if (isDateString(queryFrom) && isDateString(queryTo)) {
      setPreset("custom");
      setFrom(queryFrom);
      setTo(queryTo);
      return;
    }
    const range = getPresetRange("today", selectedStore.timezone);
    setPreset("today");
    setFrom(range.from);
    setTo(range.to);
  }, [selectedStore]);

  const loadReport = React.useCallback(
    async (signal?: AbortSignal) => {
      if (!selectedStore || !from || !to) return;
      setLoading(true);
      try {
        setReport(
          await getSalesReport(selectedStore.id, from, to, page, signal),
        );
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          showErrorToast("Unable to load report", error.message);
        }
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [selectedStore, from, to, page],
  );

  React.useEffect(() => {
    const controller = new AbortController();
    void loadReport(controller.signal);
    return () => controller.abort();
  }, [loadReport]);

  function changePreset(value: Preset) {
    setPreset(value);
    setPage(1);
    if (!selectedStore || value === "custom") return;
    const range = getPresetRange(value, selectedStore.timezone);
    setFrom(range.from);
    setTo(range.to);
  }

  async function applyFilter() {
    setPage(1);
    if (page === 1) await loadReport();
    setFilterOpen(false);
  }

  async function closeReport() {
    if (!selectedStore || !report) return;
    const label = from === to ? from : `${from} through ${to}`;
    if (!window.confirm(`Close the sales report for ${label}?`)) return;

    setClosing(true);
    try {
      const result = await closeSalesReport(selectedStore.id, from, to);
      setReport((current) =>
        current ? { ...current, closedReport: result.report } : current,
      );
      if (result.telegramSent) {
        showSuccessToast(
          "Report closed",
          "The closing summary was sent to Telegram.",
        );
      } else {
        showSuccessToast(
          "Report closed",
          "Telegram is not configured or the notification could not be sent.",
        );
      }
    } catch (error) {
      showErrorToast(
        "Unable to close report",
        error instanceof Error ? error.message : undefined,
      );
    } finally {
      setClosing(false);
    }
  }

  async function downloadReport() {
    if (!report || !selectedStore) return;
    await exportExcelWorkbook(
      `${selectedStore.slug}-report-${from}-${to}.xlsx`,
      [
        {
          name: "Summary",
          headers: ["Metric", "Value"],
          rows: [
            ["Store", selectedStore.name],
            ["From", from],
            ["To", to],
            ["Time zone", report.range.timeZone],
            ["Orders", report.summary.orderCount],
            ["Completed", report.summary.completedCount],
            ["Cancelled", report.summary.cancelledCount],
            [
              "Sales total",
              formatMoney(report.summary.total, report.summary.currency),
            ],
            [
              "Average order",
              formatMoney(report.summary.averageOrder, report.summary.currency),
            ],
            ["Currency", report.summary.currency],
          ],
        },
        {
          name: "Invoices",
          headers: [
            "Invoice",
            "Date",
            "Source",
            "Table",
            "Status",
            "Payment",
            "Total",
            "Currency",
            "Note",
          ],
          rows: report.orders.map((order) => [
            order.id.slice(-8).toUpperCase(),
            new Date(order.createdAt),
            order.source,
            order.table?.number ?? "Shared QR",
            order.status,
            order.paymentMethod,
            Number(order.subtotal),
            order.currency,
            order.note,
          ]),
          dateColumns: [1],
          currencyColumns: [6],
        },
        {
          name: "Items",
          headers: [
            "Invoice",
            "Product",
            "Options",
            "Quantity",
            "Unit price",
            "Line total",
            "Currency",
          ],
          rows: report.orders.flatMap((order) =>
            order.items.map((item) => [
              order.id.slice(-8).toUpperCase(),
              item.productName,
              item.options.map((option) => option.optionName).join(" · "),
              item.quantity,
              Number(item.unitPrice),
              Number(item.lineTotal),
              order.currency,
            ]),
          ),
          currencyColumns: [4, 5],
        },
      ],
    );
  }

  async function downloadVisualReport(format: "pdf" | "png") {
    if (!report || !selectedStore || !exportDocumentRef.current) return;
    setExporting(format);
    try {
      await document.fonts?.ready;
      await waitForImages(exportDocumentRef.current);
      const html2canvas = (await import("html2canvas-pro")).default;
      const canvas = await html2canvas(exportDocumentRef.current, {
        backgroundColor: "#f7f5f0",
        scale: 2,
        useCORS: true,
        logging: false,
        onclone: prepareReportCaptureDocument,
      });
      const filename = `${selectedStore.slug}-report-${from}-${to}`;

      if (format === "png") {
        const blob = await new Promise<Blob>((resolve, reject) =>
          canvas.toBlob(
            (value) =>
              value
                ? resolve(value)
                : reject(new Error("Unable to create PNG")),
            "image/png",
          ),
        );
        downloadBlob(blob, `${filename}.png`);
      } else {
        const { jsPDF } = await import("jspdf");
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
          compress: true,
        });
        const margin = 8;
        const availableWidth = 210 - margin * 2;
        const availableHeight = 297 - margin * 2;
        const scale = Math.min(
          availableWidth / canvas.width,
          availableHeight / canvas.height,
        );
        const width = canvas.width * scale;
        const height = canvas.height * scale;
        pdf.addImage(
          canvas.toDataURL("image/png"),
          "PNG",
          (210 - width) / 2,
          (297 - height) / 2,
          width,
          height,
          undefined,
          "FAST",
        );
        pdf.save(`${filename}.pdf`);
      }
      showSuccessToast(
        `${format.toUpperCase()} report downloaded`,
        "The professional report layout is ready to share.",
      );
    } catch (error) {
      showErrorToast(
        `Unable to create ${format.toUpperCase()}`,
        error instanceof Error ? error.message : undefined,
      );
    } finally {
      setExporting(null);
    }
  }

  async function downloadInvoice(order: StoreOrder) {
    await exportExcelWorkbook(`invoice-${order.id.slice(-8)}.xlsx`, [
      {
        name: "Invoice",
        headers: ["Field", "Value"],
        rows: [
          ["Invoice", order.id.slice(-8).toUpperCase()],
          ["Store", selectedStore?.name ?? ""],
          ["Created", new Date(order.createdAt).toLocaleString()],
          ["Status", order.status],
          ["Source", orderLocation(order)],
          ["Payment", order.paymentMethod],
          ["Total", formatMoney(order.subtotal, order.currency)],
          ["Currency", order.currency],
          ["Note", order.note],
        ],
      },
      {
        name: "Items",
        headers: ["Product", "Options", "Quantity", "Unit price", "Total"],
        rows: order.items.map((item) => [
          item.productName,
          item.options.map((option) => option.optionName).join(" · "),
          item.quantity,
          Number(item.unitPrice),
          Number(item.lineTotal),
        ]),
        currencyColumns: [3, 4],
      },
    ]);
  }

  if (!loading && !selectedStore) {
    return (
      <section className="rounded-2xl border border-dashed bg-card p-12 text-center">
        <StoreIcon className="mx-auto size-9 text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">
          No store is assigned to this account.
        </p>
      </section>
    );
  }

  return (
    <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
      <div className="min-w-0 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Reporting period
            </p>
            <p className="mt-1 text-sm font-medium">
              {report
                ? report.range.from === report.range.to
                  ? report.range.from
                  : `${report.range.from} – ${report.range.to}`
                : "Loading…"}
            </p>
          </div>
          <SheetTrigger render={<Button variant="outline" />}>
            <ListFilterIcon /> Filter dates
          </SheetTrigger>
        </div>

        {report ? (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                icon={ReceiptTextIcon}
                label="Orders"
                value={String(report.summary.orderCount)}
                detail={`${report.summary.completedCount} completed`}
              />
              <MetricCard
                icon={CheckCircle2Icon}
                label="Sales total"
                value={formatMoney(
                  report.summary.total,
                  report.summary.currency,
                )}
                detail="Completed invoices only"
              />
              <MetricCard
                icon={FileTextIcon}
                label="Average order"
                value={formatMoney(
                  report.summary.averageOrder,
                  report.summary.currency,
                )}
                detail={`${report.summary.cancelledCount} cancelled`}
              />
              <MetricCard
                icon={CalendarDaysIcon}
                label="Period"
                value={
                  report.range.dayCount === 1
                    ? "1 day"
                    : `${report.range.dayCount} days`
                }
                detail={report.range.timeZone}
              />
            </section>

            <section className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div>
                  <h2 className="flex items-center gap-2 font-semibold">
                    <LockKeyholeIcon className="size-4" /> Report closing
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {report.closedReport
                      ? `Closed by ${report.closedReport.closedBy.name} on ${new Date(report.closedReport.closedAt).toLocaleString()}.`
                      : "Closing saves a permanent snapshot and sends the summary to Telegram when alerts are configured."}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={downloadReport}
                  >
                    <FileSpreadsheetIcon /> Excel
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={Boolean(exporting)}
                    onClick={() => void downloadVisualReport("pdf")}
                  >
                    <FileTextIcon />
                    {exporting === "pdf" ? "Creating…" : "PDF"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={Boolean(exporting)}
                    onClick={() => void downloadVisualReport("png")}
                  >
                    <FileImageIcon />
                    {exporting === "png" ? "Creating…" : "PNG"}
                  </Button>
                  <Button
                    type="button"
                    onClick={closeReport}
                    disabled={closing || Boolean(report.closedReport)}
                  >
                    {report.closedReport ? (
                      <CheckCircle2Icon />
                    ) : (
                      <SendIcon className={closing ? "animate-pulse" : ""} />
                    )}
                    {report.closedReport
                      ? report.closedReport.telegramSent
                        ? "Closed & sent"
                        : "Report closed"
                      : closing
                        ? "Closing…"
                        : "Close report"}
                  </Button>
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
              <div className="flex items-start justify-between gap-4 border-b p-5">
                <div>
                  <h2 className="font-semibold">Invoices</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Showing 10 invoices per page for the selected period.
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[58rem] text-sm">
                  <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3">Invoice</th>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">Location</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Items</th>
                      <th className="px-5 py-3 text-right">Total</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {report.orders.map((order) => (
                      <tr key={order.id} className="hover:bg-muted/30">
                        <td className="px-5 py-3 font-medium">
                          #{order.id.slice(-8).toUpperCase()}
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">
                          {new Date(order.createdAt).toLocaleString()}
                        </td>
                        <td className="px-5 py-3">{orderLocation(order)}</td>
                        <td className="px-5 py-3">
                          {formatLabel(order.status)}
                        </td>
                        <td className="px-5 py-3">{order.items.length}</td>
                        <td className="px-5 py-3 text-right font-medium">
                          {formatMoney(order.subtotal, order.currency)}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => void downloadInvoice(order)}
                            >
                              <DownloadIcon /> Invoice
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              render={
                                <Link
                                  href={`/merchant/reports/invoices/${order.id}`}
                                  target="_blank"
                                />
                              }
                            >
                              <FileTextIcon /> Print / PDF
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!report.orders.length ? (
                <p className="p-10 text-center text-sm text-muted-foreground">
                  No invoices were recorded in this period.
                </p>
              ) : null}
              <div className="flex flex-col gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  {report.pagination.totalItems
                    ? `Showing ${(report.pagination.page - 1) * report.pagination.pageSize + 1}–${Math.min(report.pagination.page * report.pagination.pageSize, report.pagination.totalItems)} of ${report.pagination.totalItems}`
                    : "0 invoices"}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={loading || report.pagination.page <= 1}
                    onClick={() =>
                      setPage((current) => Math.max(1, current - 1))
                    }
                  >
                    <ChevronLeftIcon /> Previous
                  </Button>
                  <span className="min-w-20 text-center text-xs font-medium text-muted-foreground">
                    Page {report.pagination.page} of{" "}
                    {report.pagination.totalPages}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={
                      loading ||
                      report.pagination.page >= report.pagination.totalPages
                    }
                    onClick={() => setPage((current) => current + 1)}
                  >
                    Next <ChevronRightIcon />
                  </Button>
                </div>
              </div>
            </section>
          </>
        ) : loading ? (
          <section className="rounded-2xl border bg-card p-12 text-center text-sm text-muted-foreground">
            Loading report…
          </section>
        ) : null}
      </div>

      <SheetContent side="right" className="w-[90vw] gap-0 sm:max-w-sm">
        <SheetHeader className="border-b p-5 pr-12">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-muted">
              <CalendarDaysIcon className="size-4" />
            </span>
            <div>
              <SheetTitle>Date filter</SheetTitle>
              <SheetDescription>Choose a reporting period</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid gap-4">
            <label className="grid gap-1.5 text-sm font-medium">
              Period
              <select
                value={preset}
                onChange={(event) => changePreset(event.target.value as Preset)}
                className="h-9 w-full rounded-lg border bg-background px-3 text-sm"
              >
                {Object.entries(presetLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              From date
              <Input
                type="date"
                value={from}
                max={
                  to ||
                  (selectedStore
                    ? getDateInTimeZone(selectedStore.timezone)
                    : undefined)
                }
                onChange={(event) => {
                  setPreset("custom");
                  setPage(1);
                  setFrom(event.target.value);
                }}
              />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              To date
              <Input
                type="date"
                value={to}
                min={from || undefined}
                max={
                  selectedStore
                    ? getDateInTimeZone(selectedStore.timezone)
                    : undefined
                }
                onChange={(event) => {
                  setPreset("custom");
                  setPage(1);
                  setTo(event.target.value);
                }}
              />
            </label>
            <Button
              type="button"
              className="w-full"
              onClick={() => void applyFilter()}
              disabled={loading || !from || !to}
            >
              <RefreshCwIcon className={loading ? "animate-spin" : ""} />
              Apply filter
            </Button>
          </div>

          {report ? (
            <div className="mt-5 border-t pt-4 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">
                {report.range.from === report.range.to
                  ? report.range.from
                  : `${report.range.from} – ${report.range.to}`}
              </p>
              <p className="mt-1">{report.range.timeZone}</p>
            </div>
          ) : null}
        </div>
      </SheetContent>
      {selectedStore && report ? (
        <ReportExportDocument
          ref={exportDocumentRef}
          store={selectedStore}
          report={report}
        />
      ) : null}
    </Sheet>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="size-4" /> {label}
      </div>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </article>
  );
}

function getPresetRange(preset: Exclude<Preset, "custom">, timeZone: string) {
  const today = getDateInTimeZone(timeZone);
  if (preset === "today") return { from: today, to: today };
  if (preset === "yesterday") {
    const yesterday = addDays(today, -1);
    return { from: yesterday, to: yesterday };
  }
  if (preset === "this_month") {
    return { from: `${today.slice(0, 7)}-01`, to: today };
  }
  if (preset === "last_month") {
    const firstThisMonth = `${today.slice(0, 7)}-01`;
    const lastPreviousMonth = addDays(firstThisMonth, -1);
    return {
      from: `${lastPreviousMonth.slice(0, 7)}-01`,
      to: lastPreviousMonth,
    };
  }

  const day = new Date(`${today}T00:00:00Z`).getUTCDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  const currentMonday = addDays(today, -daysSinceMonday);
  return { from: addDays(currentMonday, -7), to: addDays(currentMonday, -1) };
}

function getDateInTimeZone(timeZone: string) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return `${values.year}-${values.month}-${values.day}`;
}

function addDays(value: string, amount: number) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

function isDateString(value: string | null): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
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

function orderLocation(order: StoreOrder) {
  if (order.source === "MANUAL") return "Walk-in sale";
  return order.table ? `Table ${order.table.number}` : "Shared QR";
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

function prepareReportCaptureDocument(clonedDocument: Document) {
  const root = clonedDocument.documentElement;

  // html2canvas 1.x cannot parse Tailwind 4's oklch theme colors. Override
  // only the cloned document so the live application theme remains unchanged.
  root.style.setProperty("--background", "#f7f5f0", "important");
  root.style.setProperty("--foreground", "#18181b", "important");
  root.style.setProperty("--border", "#ded9cf", "important");
  root.style.setProperty("--ring", "#a1a1aa", "important");
  root.style.setProperty("background-color", "#f7f5f0", "important");
  root.style.setProperty("color", "#18181b", "important");

  if (clonedDocument.body) {
    clonedDocument.body.style.setProperty(
      "background-color",
      "#f7f5f0",
      "important",
    );
    clonedDocument.body.style.setProperty("color", "#18181b", "important");
  }
}

async function waitForImages(container: HTMLElement) {
  const images = Array.from(container.querySelectorAll("img"));

  await Promise.all(
    images.map(async (image) => {
      const loading =
        typeof image.decode === "function"
          ? image.decode().catch(() => undefined)
          : new Promise<void>((resolve) => {
              if (image.complete) {
                resolve();
                return;
              }
              image.addEventListener("load", () => resolve(), { once: true });
              image.addEventListener("error", () => resolve(), { once: true });
            });

      await Promise.race([
        loading,
        new Promise<void>((resolve) => window.setTimeout(resolve, 3_000)),
      ]);
    }),
  );
}
