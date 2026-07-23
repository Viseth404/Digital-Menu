import { apiRequest } from "@/lib/api-client";
import type { AnalyticsRange, StoreAnalytics } from "./types";

export function getStoreAnalytics(
  storeId: string,
  range: AnalyticsRange,
  signal?: AbortSignal,
) {
  return apiRequest<StoreAnalytics>(
    `/merchant/stores/${storeId}/analytics?range=${range}`,
    { signal },
  );
}
