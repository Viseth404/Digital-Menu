"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "./auth-api";
import { AuthenticatedUser } from "./types";
import { appConfig } from "@/config/app-config";

const userUpdatedEvent = "auth:user-updated";

export function notifyCurrentUserUpdated(user: AuthenticatedUser) {
  window.dispatchEvent(
    new CustomEvent<AuthenticatedUser>(userUpdatedEvent, { detail: user }),
  );
}

export function useCurrentUser() {
  const router = useRouter();
  const [user, setUser] = React.useState<AuthenticatedUser | null>(null);

  React.useEffect(() => {
    const controller = new AbortController();
    const handleUserUpdated = (event: Event) => {
      setUser((event as CustomEvent<AuthenticatedUser>).detail);
    };
    window.addEventListener(userUpdatedEvent, handleUserUpdated);

    getCurrentUser({ signal: controller.signal })
      .then(setUser)
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== "AbortError") {
          router.replace(appConfig.routes.login);
        }
      });

    return () => {
      controller.abort();
      window.removeEventListener(userUpdatedEvent, handleUserUpdated);
    };
  }, [router]);

  return user;
}
