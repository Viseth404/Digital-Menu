import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/server/api-response";
import { prisma } from "@/lib/server/prisma";
import { requireRequestUser } from "@/lib/server/session";

export async function GET(request: NextRequest) {
  try {
    await requireRequestUser(request, [UserRole.ADMIN]);
    const search = request.nextUrl.searchParams.get("search")?.trim();
    const action = request.nextUrl.searchParams.get("action")?.trim();
    return NextResponse.json(
      await prisma.adminAuditLog.findMany({
        where: {
          action: action || undefined,
          OR: search
            ? [
                { targetName: { contains: search, mode: "insensitive" } },
                { targetType: { contains: search, mode: "insensitive" } },
                {
                  admin: {
                    name: { contains: search, mode: "insensitive" },
                  },
                },
                {
                  admin: {
                    email: { contains: search, mode: "insensitive" },
                  },
                },
              ]
            : undefined,
        },
        include: { admin: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
        take: 500,
      }),
    );
  } catch (error) {
    return handleApiError(error);
  }
}
