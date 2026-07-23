import { apiRequest } from "@/lib/api-client";
import { AuthenticatedUser, LoginCredentials } from "./types";

export function login(credentials: LoginCredentials) {
  return apiRequest<{ user: AuthenticatedUser }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export function getCurrentUser(options?: { signal?: AbortSignal }) {
  return apiRequest<AuthenticatedUser>("/auth/me", {
    signal: options?.signal,
  });
}

export function logout() {
  return apiRequest<{ success: boolean }>("/auth/logout", {
    method: "POST",
  });
}

export function changePassword(input: {
  currentPassword: string;
  newPassword: string;
}) {
  return apiRequest<{ success: true }>("/auth/change-password", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateProfile(input: {
  name: string;
  email: string;
  currentPassword?: string;
}) {
  return apiRequest<AuthenticatedUser>("/auth/profile", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
