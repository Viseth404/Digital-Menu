import { apiRequest } from "@/lib/api-client";
import type {
  AdminOrder,
  AdminOrdersResponse,
  AuditEntry,
  PlatformOverview,
  SystemHealth,
} from "./platform-types";

export function getPlatformOverview(signal?: AbortSignal) {
  return apiRequest<PlatformOverview>("/admin/overview", { signal });
}

export function getAdminOrders(
  filters: {
    search?: string;
    merchantId?: string;
    storeId?: string;
    status?: string;
    source?: string;
    from?: string;
    to?: string;
    sort?: string;
    page?: number;
    pageSize?: number;
  },
  signal?: AbortSignal,
) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  return apiRequest<AdminOrdersResponse>(`/admin/orders?${query}`, { signal });
}

export function updateAdminOrderStatus(orderId: string, status: string) {
  return apiRequest<AdminOrder>(`/admin/orders/${orderId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function deleteAdminOrder(orderId: string) {
  return apiRequest<{ success: true }>(`/admin/orders/${orderId}`, {
    method: "DELETE",
  });
}

export function getAuditEntries(search: string, signal?: AbortSignal) {
  const query = new URLSearchParams();
  if (search) query.set("search", search);
  return apiRequest<AuditEntry[]>(`/admin/audit?${query}`, { signal });
}

export function getSystemHealth(signal?: AbortSignal) {
  return apiRequest<SystemHealth>("/admin/system-health", { signal });
}

export function deleteOrphanedUpload(filename: string) {
  return apiRequest<{ success: true }>(
    `/admin/uploads/${encodeURIComponent(filename)}`,
    { method: "DELETE" },
  );
}

export function updatePlatformSettings(
  input: Omit<
    SystemHealth["settings"],
    "updatedAt" | "telegramBotConfigured" | "removeBgConfigured"
  > & {
    telegramBotToken?: string;
    removeBgApiKey?: string;
  },
) {
  return apiRequest<SystemHealth["settings"]>("/admin/settings", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
