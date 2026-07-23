import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { writeAdminAudit } from "@/features/admin-support/server/audit";
import { ApiException, handleApiError } from "@/lib/server/api-response";
import { hashPassword } from "@/lib/server/password";
import { prisma } from "@/lib/server/prisma";
import { requireRequestUser } from "@/lib/server/session";
import {
  assertEmail,
  readObject,
  readString,
} from "@/lib/server/validation";

const administratorSelect = {
  id: true,
  name: true,
  email: true,
  isActive: true,
  createdAt: true,
} as const;

export async function GET(request: NextRequest) {
  try {
    await requireRequestUser(request, [UserRole.ADMIN]);
    return NextResponse.json(
      await prisma.user.findMany({
        where: { role: UserRole.ADMIN },
        select: administratorSelect,
        orderBy: { createdAt: "asc" },
      }),
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentAdmin = await requireRequestUser(request, [UserRole.ADMIN]);
    const body = readObject(await request.json());
    const name = readString(body, "name", { min: 2 })!;
    const email = assertEmail(readString(body, "email")!);
    const password = readString(body, "password", { min: 8 })!;

    if (await prisma.user.findUnique({ where: { email } })) {
      throw new ApiException("Email is already in use", 409);
    }

    const administrator = await prisma.$transaction(async (transaction) => {
      const created = await transaction.user.create({
        data: {
          name,
          email,
          passwordHash: hashPassword(password),
          role: UserRole.ADMIN,
        },
        select: administratorSelect,
      });
      await writeAdminAudit(transaction, {
        adminId: currentAdmin.id,
        action: "ADMINISTRATOR_CREATED",
        targetType: "USER",
        targetId: created.id,
        targetName: created.name,
        details: { email: created.email },
        request,
      });
      return created;
    });

    return NextResponse.json(administrator, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
