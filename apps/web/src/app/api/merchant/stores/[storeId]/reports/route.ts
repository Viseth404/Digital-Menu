import { Prisma, UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getReportDateRange } from "@/features/reports/server/date-range";
import { getReportSnapshot } from "@/features/reports/server/report-data";
import { sendTelegramReportClosedAlert } from "@/features/reports/server/telegram";
import { requireManagedStore } from "@/features/stores/merchant-access";
import { ApiException, handleApiError } from "@/lib/server/api-response";
import { prisma } from "@/lib/server/prisma";
import { requireRequestUser } from "@/lib/server/session";
import { readObject, readString } from "@/lib/server/validation";

type Context = { params: Promise<{ storeId: string }> };

function getPublicRequestOrigin(request: NextRequest) {
  const forwardedHost = request.headers
    .get("x-forwarded-host")
    ?.split(",")[0]
    ?.trim();
  const forwardedProtocol = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();

  if (forwardedHost) {
    try {
      return new URL(`${forwardedProtocol || "https"}://${forwardedHost}`)
        .origin;
    } catch {
      // Fall back to the framework-provided origin for malformed proxy headers.
    }
  }

  const railwayPublicDomain = process.env.RAILWAY_PUBLIC_DOMAIN?.trim();
  if (railwayPublicDomain) {
    return new URL(`https://${railwayPublicDomain}`).origin;
  }

  return request.nextUrl.origin;
}

export async function GET(request: NextRequest, context: Context) {
  try {
    const { storeId } = await context.params;
    const store = await requireManagedStore(request, storeId);
    const range = getReportDateRange(
      request.nextUrl.searchParams.get("from"),
      request.nextUrl.searchParams.get("to"),
      store.timezone,
    );
    const page = readPage(request.nextUrl.searchParams.get("page"));
    const [snapshot, closedReport] = await Promise.all([
      getReportSnapshot(store.id, store.currency, range.start, range.end, {
        page,
      }),
      prisma.salesReport.findUnique({
        where: {
          storeId_periodStart_periodEnd: {
            storeId: store.id,
            periodStart: range.start,
            periodEnd: range.end,
          },
        },
        include: { closedBy: { select: { name: true } } },
      }),
    ]);

    return NextResponse.json({
      range: {
        from: range.from,
        to: range.to,
        dayCount: range.dayCount,
        timeZone: store.timezone,
      },
      ...snapshot,
      closedReport: closedReport
        ? serializeClosedReport(closedReport, range.from, range.to)
        : null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, context: Context) {
  try {
    const { storeId } = await context.params;
    const [store, user] = await Promise.all([
      requireManagedStore(request, storeId),
      requireRequestUser(request, [UserRole.MERCHANT]),
    ]);
    const body = readObject(await request.json());
    const range = getReportDateRange(
      readString(body, "from")!,
      readString(body, "to")!,
      store.timezone,
    );
    const snapshot = await getReportSnapshot(
      store.id,
      store.currency,
      range.start,
      range.end,
      { includeOrders: false },
    );

    let closedReport;
    try {
      closedReport = await prisma.salesReport.create({
        data: {
          storeId: store.id,
          closedById: user.id,
          periodStart: range.start,
          periodEnd: range.end,
          orderCount: snapshot.summary.orderCount,
          completedCount: snapshot.summary.completedCount,
          cancelledCount: snapshot.summary.cancelledCount,
          total: new Prisma.Decimal(snapshot.summary.total),
          currency: store.currency,
        },
        include: { closedBy: { select: { name: true } } },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ApiException("This date range has already been closed", 409);
      }
      throw error;
    }

    const query = new URLSearchParams({
      store: store.id,
      from: range.from,
      to: range.to,
    });
    const reportUrl = new URL(
      `/merchant/reports?${query.toString()}`,
      getPublicRequestOrigin(request),
    ).toString();
    const telegramSent = await sendTelegramReportClosedAlert(
      store,
      {
        from: range.from,
        to: range.to,
        orderCount: closedReport.orderCount,
        completedCount: closedReport.completedCount,
        cancelledCount: closedReport.cancelledCount,
        total: closedReport.total.toString(),
        currency: closedReport.currency,
      },
      user.name,
      reportUrl,
    );
    if (telegramSent) {
      closedReport = await prisma.salesReport.update({
        where: { id: closedReport.id },
        data: { telegramSent: true },
        include: { closedBy: { select: { name: true } } },
      });
    }

    return NextResponse.json({
      report: serializeClosedReport(closedReport, range.from, range.to),
      telegramSent,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

function readPage(value: string | null) {
  if (!value) return 1;
  const page = Number(value);
  if (!Number.isInteger(page) || page < 1 || page > 1_000_000) {
    throw new ApiException("page must be a positive integer", 400);
  }
  return page;
}

function serializeClosedReport(
  report: {
    id: string;
    orderCount: number;
    completedCount: number;
    cancelledCount: number;
    total: { toString(): string };
    currency: string;
    telegramSent: boolean;
    closedAt: Date;
    closedBy: { name: string };
  },
  from: string,
  to: string,
) {
  return {
    id: report.id,
    from,
    to,
    orderCount: report.orderCount,
    completedCount: report.completedCount,
    cancelledCount: report.cancelledCount,
    total: report.total.toString(),
    currency: report.currency,
    telegramSent: report.telegramSent,
    closedAt: report.closedAt,
    closedBy: report.closedBy,
  };
}
