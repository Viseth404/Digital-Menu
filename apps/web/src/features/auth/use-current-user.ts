"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "./auth-api";
import { AuthenticatedUser } from "./types";
import { appConfig } from "@/config/app-config";

export function useCurrentUser() {
  const router = useRouter();
  const [user, setUser] = React.useState<AuthenticatedUser | null>(null);

  React.useEffect(() => {
    const controller = new AbortController();

    getCurrentUser({ signal: controller.signal })
      .then(setUser)
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== "AbortError") {
          router.replace(appConfig.routes.login);
        }
      });

    return () => controller.abort();
  }, [router]);

  return user;
}
