import { apiRequest } from "@/lib/api-client";
import type { CloseReportResult, SalesReport } from "./types";

export function getSalesReport(
  storeId: string,
  from: string,
  to: string,
  page = 1,
  signal?: AbortSignal,
) {
  const query = new URLSearchParams({ from, to, page: String(page) });
  return apiRequest<SalesReport>(
    `/merchant/stores/${storeId}/reports?${query.toString()}`,
    { signal },
  );
}

export function closeSalesReport(storeId: string, from: string, to: string) {
  return apiRequest<CloseReportResult>(`/merchant/stores/${storeId}/reports`, {
    method: "POST",
    body: JSON.stringify({ from, to }),
  });
}
