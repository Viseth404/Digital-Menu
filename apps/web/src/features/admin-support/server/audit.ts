import "server-only";

import type { Prisma, PrismaClient } from "@prisma/client";
import type { NextRequest } from "next/server";

type DatabaseClient = PrismaClient | Prisma.TransactionClient;

export function getRequestIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null
  );
}

export function writeAdminAudit(
  database: DatabaseClient,
  input: {
    adminId: string;
    action: string;
    targetType: string;
    targetId?: string;
    targetName?: string;
    details?: Prisma.InputJsonValue;
    request: NextRequest;
  },
) {
  return database.adminAuditLog.create({
    data: {
      adminId: input.adminId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      targetName: input.targetName,
      details: input.details,
      ipAddress: getRequestIp(input.request),
      userAgent: input.request.headers.get("user-agent")?.slice(0, 500) ?? null,
    },
  });
}
