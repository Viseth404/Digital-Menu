import { MerchantMemberRole, UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { ApiException, handleApiError } from "@/lib/server/api-response";
import { writeAdminAudit } from "@/features/admin-support/server/audit";
import { prisma } from "@/lib/server/prisma";
import { requireRequestUser } from "@/lib/server/session";
import { readObject, readString } from "@/lib/server/validation";

type Context = { params: Promise<{ membershipId: string }> };

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const admin = await requireRequestUser(request, [UserRole.ADMIN]);
    const { membershipId } = await context.params;
    const body = readObject(await request.json());
    const role = readString(body, "role") as MerchantMemberRole;
    if (!Object.values(MerchantMemberRole).includes(role)) {
      throw new ApiException("Invalid membership role", 400);
    }
    const membership = await getMembership(membershipId);
    await assertOwnerRemains(membership, role);
    const updated = await prisma.$transaction(async (transaction) => {
      const value = await transaction.merchantMember.update({
        where: { id: membershipId },
        data: { role },
        select: { id: true, role: true },
      });
      await writeAdminAudit(transaction, {
        adminId: admin.id,
        action: "MEMBERSHIP_ROLE_CHANGED",
        targetType: "MEMBERSHIP",
        targetId: membershipId,
        targetName: `${membership.user.name} at ${membership.merchant.name}`,
        details: { before: membership.role, after: role },
        request,
      });
      return value;
    });
    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  try {
    const admin = await requireRequestUser(request, [UserRole.ADMIN]);
    const { membershipId } = await context.params;
    const membership = await getMembership(membershipId);
    if (membership.user.role === UserRole.ADMIN) {
      throw new ApiException(
        "Administrator accounts cannot be removed here",
        400,
      );
    }

    let removedMemberships = 0;
    await prisma.$transaction(async (transaction) => {
      const removed = await transaction.merchantMember.deleteMany({
        where: { userId: membership.user.id },
      });
      removedMemberships = removed.count;
      await transaction.session.deleteMany({
        where: { userId: membership.user.id },
      });
      await transaction.user.update({
        where: { id: membership.user.id },
        data: { isActive: false },
      });
      await writeAdminAudit(transaction, {
        adminId: admin.id,
        action: "MERCHANT_USER_REMOVED",
        targetType: "USER",
        targetId: membership.user.id,
        targetName: membership.user.name,
        details: {
          email: membership.user.email,
          requestedMembershipId: membershipId,
          requestedMerchant: membership.merchant.name,
          role: membership.role,
          removedMemberships,
          accountDisabled: true,
          sessionsRevoked: true,
        },
        request,
      });
    });
    return NextResponse.json({ success: true, removedMemberships });
  } catch (error) {
    return handleApiError(error);
  }
}

function getMembership(id: string) {
  return prisma.merchantMember.findUniqueOrThrow({
    where: { id },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true },
      },
      merchant: { select: { id: true, name: true } },
    },
  });
}

async function assertOwnerRemains(
  membership: Awaited<ReturnType<typeof getMembership>>,
  nextRole: MerchantMemberRole | null,
) {
  if (
    membership.role !== MerchantMemberRole.OWNER ||
    nextRole === MerchantMemberRole.OWNER
  ) {
    return;
  }
  const owners = await prisma.merchantMember.count({
    where: {
      merchantId: membership.merchant.id,
      role: MerchantMemberRole.OWNER,
    },
  });
  if (owners <= 1) {
    throw new ApiException(
      "Assign another owner before changing or removing the last owner",
      409,
    );
  }
}
