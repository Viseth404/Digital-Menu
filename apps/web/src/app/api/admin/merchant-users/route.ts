import { MerchantMemberRole, UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { ApiException, handleApiError } from "@/lib/server/api-response";
import { writeAdminAudit } from "@/features/admin-support/server/audit";
import { hashPassword } from "@/lib/server/password";
import { prisma } from "@/lib/server/prisma";
import { requireRequestUser } from "@/lib/server/session";
import {
  assertEmail,
  assertSlug,
  readObject,
  readString,
} from "@/lib/server/validation";

const merchantUserSelect = {
  id: true,
  name: true,
  email: true,
  isActive: true,
  createdAt: true,
  memberships: {
    select: {
      role: true,
      merchant: {
        select: {
          id: true,
          name: true,
          slug: true,
          contactEmail: true,
          phone: true,
          status: true,
          _count: { select: { stores: true } },
        },
      },
    },
  },
} as const;

export async function GET(request: NextRequest) {
  try {
    await requireRequestUser(request, [UserRole.ADMIN]);
    return NextResponse.json(
      await prisma.user.findMany({
        where: { role: UserRole.MERCHANT },
        select: merchantUserSelect,
        orderBy: { createdAt: "desc" },
      }),
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireRequestUser(request, [UserRole.ADMIN]);
    const body = readObject(await request.json());
    const ownerName = readString(body, "ownerName", { min: 2 })!;
    const ownerEmail = assertEmail(readString(body, "ownerEmail")!);
    const ownerPhone = readString(body, "ownerPhone", { optional: true });
    const password = readString(body, "password", { min: 8 })!;
    const merchantName = readString(body, "merchantName", { min: 2 })!;
    const merchantSlug = assertSlug(
      readString(body, "merchantSlug")!,
      "merchantSlug",
    );

    const [existingUser, existingMerchant] = await Promise.all([
      prisma.user.findUnique({ where: { email: ownerEmail } }),
      prisma.merchant.findUnique({ where: { slug: merchantSlug } }),
    ]);
    if (existingUser) throw new ApiException("Email is already in use", 409);
    if (existingMerchant) {
      throw new ApiException("Merchant slug is already in use", 409);
    }

    const createdUser = await prisma.$transaction(async (transaction) => {
      const user = await transaction.user.create({
        data: {
          name: ownerName,
          email: ownerEmail,
          passwordHash: hashPassword(password),
          role: UserRole.MERCHANT,
        },
      });
      const merchant = await transaction.merchant.create({
        data: {
          name: merchantName,
          slug: merchantSlug,
          contactEmail: ownerEmail,
          phone: ownerPhone,
          status: "ACTIVE",
          createdById: admin.id,
          members: {
            create: { userId: user.id, role: MerchantMemberRole.OWNER },
          },
          stores: {
            create: { name: merchantName, slug: merchantSlug },
          },
        },
      });
      await writeAdminAudit(transaction, {
        adminId: admin.id,
        action: "MERCHANT_CREATED",
        targetType: "MERCHANT",
        targetId: merchant.id,
        targetName: merchant.name,
        details: { ownerEmail, initialStore: true },
        request,
      });
      return transaction.user.findUniqueOrThrow({
        where: { id: user.id },
        select: merchantUserSelect,
      });
    });

    return NextResponse.json(createdUser, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
