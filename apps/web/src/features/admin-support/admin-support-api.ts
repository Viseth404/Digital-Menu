import { apiRequest } from "@/lib/api-client";
import type {
  MembershipRole,
  MerchantStatus,
  StoreStatus,
  SupportMerchant,
} from "./types";

export function getSupportMerchants(signal?: AbortSignal) {
  return apiRequest<SupportMerchant[]>("/admin/merchants", { signal });
}

export function updateMerchantStatus(
  merchantId: string,
  status: MerchantStatus,
) {
  return apiRequest<{ id: string; status: MerchantStatus }>(
    `/admin/merchants/${merchantId}`,
    { method: "PATCH", body: JSON.stringify({ status }) },
  );
}

export function updateSupportStore(
  storeId: string,
  input: { status?: StoreStatus; isPublished?: boolean },
) {
  return apiRequest<{
    id: string;
    status: StoreStatus;
    isPublished: boolean;
  }>(`/admin/stores/${storeId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function updateSupportUser(userId: string, isActive: boolean) {
  return apiRequest<{ id: string; isActive: boolean }>(
    `/admin/users/${userId}`,
    { method: "PATCH", body: JSON.stringify({ isActive }) },
  );
}

export function resetSupportUserPassword(userId: string) {
  return apiRequest<{ temporaryPassword: string }>(
    `/admin/users/${userId}/reset-password`,
    { method: "POST" },
  );
}

export function updateMembershipRole(
  membershipId: string,
  role: MembershipRole,
) {
  return apiRequest<{ id: string; role: MembershipRole }>(
    `/admin/memberships/${membershipId}`,
    { method: "PATCH", body: JSON.stringify({ role }) },
  );
}

export function deleteMembership(membershipId: string) {
  return apiRequest<{ success: true; removedMemberships: number }>(
    `/admin/memberships/${membershipId}`,
    {
      method: "DELETE",
    },
  );
}

export function rotateStoreQrTokens(storeId: string) {
  return apiRequest<{ updated: number }>(`/admin/stores/${storeId}/rotate-qr`, {
    method: "POST",
  });
}
