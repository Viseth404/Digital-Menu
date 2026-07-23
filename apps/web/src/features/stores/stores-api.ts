import { apiRequest } from "@/lib/api-client";
import {
  Category,
  CategoryInput,
  Product,
  ProductInput,
  Store,
  UpdateStoreInput,
} from "./types";

export function getMerchantStores(options?: { signal?: AbortSignal }) {
  return apiRequest<Store[]>("/merchant/stores", { signal: options?.signal });
}

export function getStoreProducts(
  storeId: string,
  options?: { signal?: AbortSignal },
) {
  return apiRequest<Product[]>(`/merchant/stores/${storeId}/products`, {
    signal: options?.signal,
  });
}

export function createStoreProduct(storeId: string, input: ProductInput) {
  return apiRequest<Product>(`/merchant/stores/${storeId}/products`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateStoreProduct(
  storeId: string,
  productId: string,
  input: Partial<ProductInput>,
) {
  return apiRequest<Product>(
    `/merchant/stores/${storeId}/products/${productId}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
}

export function deleteStoreProduct(storeId: string, productId: string) {
  return apiRequest<{ success: true }>(
    `/merchant/stores/${storeId}/products/${productId}`,
    {
      method: "DELETE",
    },
  );
}

export function getStoreCategories(
  storeId: string,
  options?: { signal?: AbortSignal },
) {
  return apiRequest<Category[]>(`/merchant/stores/${storeId}/categories`, {
    signal: options?.signal,
  });
}

export function createStoreCategory(storeId: string, input: CategoryInput) {
  return apiRequest<Category>(`/merchant/stores/${storeId}/categories`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateStoreCategory(
  storeId: string,
  categoryId: string,
  input: Partial<CategoryInput>,
) {
  return apiRequest<Category>(
    `/merchant/stores/${storeId}/categories/${categoryId}`,
    { method: "PATCH", body: JSON.stringify(input) },
  );
}

export function deleteStoreCategory(storeId: string, categoryId: string) {
  return apiRequest<{ success: true }>(
    `/merchant/stores/${storeId}/categories/${categoryId}`,
    { method: "DELETE" },
  );
}

export function updateMerchantStore(storeId: string, input: UpdateStoreInput) {
  return apiRequest<Store>(`/merchant/stores/${storeId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function uploadMerchantImage(file: File) {
  const body = new FormData();
  body.set("file", file);
  return apiRequest<{ url: string }>("/merchant/uploads", {
    method: "POST",
    body,
  });
}
