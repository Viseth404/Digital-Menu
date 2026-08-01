import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/features/auth/server-auth";
import { PrintInvoiceButton } from "@/features/reports/components/print-invoice-button";
import { prisma } from "@/lib/server/prisma";

type InvoicePageProps = { params: Promise<{ orderId: string }> };

export default async function InvoicePage({ params }: InvoicePageProps) {
  const user = await requireRole(["MERCHANT"]);
  const { orderId } = await params;
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      store: {
        merchant: {
          members: {
            some: {
              userId: user.id,
              role: { in: ["OWNER", "MANAGER"] },
            },
          },
        },
      },
    },
    include: {
      store: true,
      table: { select: { number: true, name: true } },
      items: { include: { options: true } },
    },
  });
  if (!order) notFound();

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-8 print:bg-white print:p-0">
      <div className="print:hidden mx-auto mb-4 flex max-w-3xl items-center justify-between gap-3">
        <Button variant="outline" render={<Link href="/merchant/reports" />}>
          <ArrowLeftIcon /> Back to reports
        </Button>
        <PrintInvoiceButton />
      </div>

      <article className="mx-auto max-w-3xl bg-white p-8 shadow-sm print:max-w-none print:p-8 print:shadow-none sm:p-12">
        <header className="flex items-start justify-between gap-8 border-b pb-8">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
              Invoice
            </p>
            <h1 className="mt-2 text-3xl font-semibold">
              #{order.id.slice(-8).toUpperCase()}
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              {new Intl.DateTimeFormat("en", {
                dateStyle: "medium",
                timeStyle: "short",
                timeZone: order.store.timezone,
              }).format(order.createdAt)}
            </p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-semibold">{order.store.name}</h2>
            {order.store.nameKh ? <p>{order.store.nameKh}</p> : null}
            {order.store.address ? (
              <p className="mt-2 max-w-xs text-sm text-zinc-500">
                {order.store.address}
              </p>
            ) : null}
            {order.store.phone ? (
              <p className="mt-1 text-sm text-zinc-500">{order.store.phone}</p>
            ) : null}
          </div>
        </header>

        <section className="grid gap-5 border-b py-6 text-sm sm:grid-cols-3">
          <InvoiceDetail label="Location" value={orderLocation(order)} />
          <InvoiceDetail label="Status" value={formatLabel(order.status)} />
          <InvoiceDetail
            label="Payment"
            value={
              order.paymentMethod
                ? formatLabel(order.paymentMethod)
                : "Not recorded"
            }
          />
        </section>

        <table className="mt-8 w-full text-sm">
          <thead className="border-b text-left text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="pb-3">Item</th>
              <th className="pb-3 text-center">Qty</th>
              <th className="pb-3 text-right">Price</th>
              <th className="pb-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {order.items.map((item) => (
              <tr key={item.id} className="break-inside-avoid">
                <td className="py-4 pr-4">
                  <span className="font-medium">{item.productName}</span>
                  {item.options.length ? (
                    <span className="mt-1 block text-xs text-zinc-500">
                      {item.options
                        .map((option) => option.optionName)
                        .join(" · ")}
                    </span>
                  ) : null}
                </td>
                <td className="py-4 text-center">{item.quantity}</td>
                <td className="py-4 text-right">
                  {formatMoney(item.unitPrice.toString(), order.currency)}
                </td>
                <td className="py-4 text-right font-medium">
                  {formatMoney(item.lineTotal.toString(), order.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <section className="mt-8 flex justify-end border-t pt-6">
          <div className="flex min-w-64 items-center justify-between gap-8 text-lg font-semibold">
            <span>Total</span>
            <span>
              {formatMoney(order.subtotal.toString(), order.currency)}
            </span>
          </div>
        </section>

        {order.note ? (
          <section className="mt-8 rounded-lg bg-zinc-50 p-4 text-sm">
            <p className="font-medium">Note</p>
            <p className="mt-1 text-zinc-600">{order.note}</p>
          </section>
        ) : null}

        <footer className="mt-12 border-t pt-6 text-center text-xs text-zinc-400">
          Generated by TeamOne Digital-Menu
        </footer>
      </article>
    </main>
  );
}

function InvoiceDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}

function orderLocation(order: {
  source: string;
  table: { number: number; name: string | null } | null;
}) {
  if (order.source === "MANUAL") return "Walk-in sale";
  if (!order.table) return "Shared QR";
  return `Table ${order.table.number}${order.table.name ? ` (${order.table.name})` : ""}`;
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
