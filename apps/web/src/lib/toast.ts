"use client";

import { toast } from "@/components/ui/toast";

export function showSuccessToast(title: string, description?: string) {
  toast.add({
    title,
    description,
    type: "success",
    timeout: 4_000,
  });
}

export function showErrorToast(title: string, description?: string) {
  toast.add({
    title,
    description,
    type: "error",
    priority: "high",
    timeout: 6_000,
  });
}
