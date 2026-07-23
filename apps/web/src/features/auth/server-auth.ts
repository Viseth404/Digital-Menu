import "server-only";

import { redirect } from "next/navigation";
import { appConfig } from "@/config/app-config";
import { AuthenticatedUser, UserRole } from "./types";
import { getServerSessionUser } from "@/lib/server/session";

export async function requireUser(): Promise<AuthenticatedUser> {
  const user = await getServerSessionUser();
  if (!user) redirect(appConfig.routes.login);
  return user as AuthenticatedUser;
}

export async function requireRole(
  allowedRoles: UserRole[],
): Promise<AuthenticatedUser> {
  const user = await requireUser();

  if (!allowedRoles.includes(user.role)) {
    redirect(appConfig.routes.dashboard);
  }

  return user;
}
