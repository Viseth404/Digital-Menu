import { apiRequest } from "@/lib/api-client";
import type {
  CreateOrderInput,
  DiningTable,
  OrderStatus,
  StoreOrder,
} from "./types";

export function getStoreTables(storeId: string, signal?: AbortSignal) {
  return apiRequest<DiningTable[]>(`/merchant/stores/${storeId}/tables`, {
    signal,
  });
}

export function createStoreTable(storeId: string, number: number) {
  return apiRequest<DiningTable>(`/merchant/stores/${storeId}/tables`, {
    method: "POST",
    body: JSON.stringify({ number }),
  });
}

export function deleteStoreTable(storeId: string, tableId: string) {
  return apiRequest<{ success: true }>(
    `/merchant/stores/${storeId}/tables/${tableId}`,
    { method: "DELETE" },
  );
}

export function getStoreOrders(storeId: string, signal?: AbortSignal) {
  return apiRequest<StoreOrder[]>(`/merchant/stores/${storeId}/orders`, {
    signal,
  });
}

export function updateOrderStatus(
  storeId: string,
  orderId: string,
  status: OrderStatus,
) {
  return apiRequest<StoreOrder>(
    `/merchant/stores/${storeId}/orders/${orderId}`,
    { method: "PATCH", body: JSON.stringify({ status }) },
  );
}

export function createPublicOrder(
  merchantSlug: string,
  storeSlug: string,
  input: CreateOrderInput,
) {
  return apiRequest<StoreOrder>(
    `/public/stores/${merchantSlug}/${storeSlug}/orders`,
    { method: "POST", body: JSON.stringify(input) },
  );
}
