import { UserRole } from "@prisma/client";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { appConfig } from "@/config/app-config";
import { AuthenticatedUser } from "@/features/auth/types";
import { ApiException } from "./api-response";
import { hashSessionToken } from "./password";
import { prisma } from "./prisma";

const publicUser = {
  id: true,
  name: true,
  email: true,
  role: true,
} as const;

export async function getSessionUserFromToken(
  token?: string,
): Promise<AuthenticatedUser | null> {
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    include: {
      user: { select: { ...publicUser, isActive: true, deletedAt: true } },
    },
  });

  if (
    !session ||
    session.expiresAt <= new Date() ||
    session.revokedAt ||
    !session.user.isActive ||
    session.user.deletedAt
  ) {
    if (session) await prisma.session.delete({ where: { id: session.id } });
    return null;
  }

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  if (session.lastSeenAt < fiveMinutesAgo) {
    await prisma.session.update({
      where: { id: session.id },
      data: { lastSeenAt: new Date() },
    });
  }

  const { id, name, email, role } = session.user;
  return { id, name, email, role };
}

export async function getServerSessionUser() {
  const cookieStore = await cookies();
  return getSessionUserFromToken(
    cookieStore.get(appConfig.sessionCookieName)?.value,
  );
}

export function getRequestSessionToken(request: NextRequest) {
  return request.cookies.get(appConfig.sessionCookieName)?.value;
}

export async function requireRequestUser(
  request: NextRequest,
  allowedRoles?: UserRole[],
) {
  const user = await getSessionUserFromToken(getRequestSessionToken(request));
  if (!user) throw new ApiException("Not signed in", 401);
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    throw new ApiException("You do not have access to this resource", 403);
  }
  return user;
}
