import type { StoreOrder } from "@/features/orders/types";

export type ReportClosure = {
  id: string;
  from: string;
  to: string;
  orderCount: number;
  completedCount: number;
  cancelledCount: number;
  total: string;
  currency: string;
  telegramSent: boolean;
  closedAt: string;
  closedBy: { name: string };
};

export type SalesReport = {
  range: { from: string; to: string; dayCount: number; timeZone: string };
  summary: {
    orderCount: number;
    completedCount: number;
    cancelledCount: number;
    total: string;
    averageOrder: string;
    currency: string;
  };
  statusCounts: Record<string, number>;
  orders: StoreOrder[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  closedReport: ReportClosure | null;
};

export type CloseReportResult = {
  report: ReportClosure;
  telegramSent: boolean;
};
