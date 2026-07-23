import { apiRequest } from "@/lib/api-client";
import { CreateMerchantUserInput, MerchantUser } from "./types";

const endpoint = "/admin/merchant-users";

export function getMerchantUsers(options?: { signal?: AbortSignal }) {
  return apiRequest<MerchantUser[]>(endpoint, { signal: options?.signal });
}

export function createMerchantUser(input: CreateMerchantUserInput) {
  return apiRequest<MerchantUser>(endpoint, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
