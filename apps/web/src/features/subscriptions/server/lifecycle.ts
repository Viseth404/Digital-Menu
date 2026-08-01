import "server-only";

import { SubscriptionStatus } from "@prisma/client";
import { ApiException } from "@/lib/server/api-response";
import { prisma } from "@/lib/server/prisma";

export const SUBSCRIPTION_GRACE_PERIOD_DAYS = 7;

type SubscriptionSnapshot = {
  id: string;
  status: SubscriptionStatus;
  currentPeriodEnd: Date;
};

export function getSubscriptionGraceEndsAt(currentPeriodEnd: Date) {
  const graceEndsAt = new Date(currentPeriodEnd);
  graceEndsAt.setUTCDate(
    graceEndsAt.getUTCDate() + SUBSCRIPTION_GRACE_PERIOD_DAYS,
  );
  return graceEndsAt;
}

export function evaluateSubscription(
  subscription: SubscriptionSnapshot | null,
  now = new Date(),
) {
  if (!subscription) {
    return {
      hasAccess: false,
      expectedStatus: null,
      graceEndsAt: null,
    };
  }

  const graceEndsAt = getSubscriptionGraceEndsAt(subscription.currentPeriodEnd);

  if (
    subscription.status === SubscriptionStatus.PAUSED ||
    subscription.status === SubscriptionStatus.CANCELLED ||
    subscription.status === SubscriptionStatus.EXPIRED
  ) {
    return {
      hasAccess: false,
      expectedStatus: subscription.status,
      graceEndsAt,
    };
  }

  if (subscription.currentPeriodEnd >= now) {
    return {
      hasAccess: subscription.status !== SubscriptionStatus.PAST_DUE,
      expectedStatus: subscription.status,
      graceEndsAt,
    };
  }

  if (graceEndsAt >= now) {
    return {
      hasAccess: true,
      expectedStatus: SubscriptionStatus.PAST_DUE,
      graceEndsAt,
    };
  }

  return {
    hasAccess: false,
    expectedStatus: SubscriptionStatus.EXPIRED,
    graceEndsAt,
  };
}

export async function synchronizeAllSubscriptionLifecycles(now = new Date()) {
  const graceCutoff = new Date(now);
  graceCutoff.setUTCDate(
    graceCutoff.getUTCDate() - SUBSCRIPTION_GRACE_PERIOD_DAYS,
  );

  const [pastDue, expired] = await prisma.$transaction([
    prisma.merchantSubscription.updateMany({
      where: {
        currentPeriodEnd: { lt: now, gte: graceCutoff },
        status: {
          in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL],
        },
      },
      data: { status: SubscriptionStatus.PAST_DUE },
    }),
    prisma.merchantSubscription.updateMany({
      where: {
        currentPeriodEnd: { lt: graceCutoff },
        status: {
          in: [
            SubscriptionStatus.ACTIVE,
            SubscriptionStatus.TRIAL,
            SubscriptionStatus.PAST_DUE,
          ],
        },
      },
      data: { status: SubscriptionStatus.EXPIRED },
    }),
  ]);

  return { pastDue: pastDue.count, expired: expired.count };
}

async function synchronizeSubscription(subscription: SubscriptionSnapshot) {
  const evaluation = evaluateSubscription(subscription);
  if (
    evaluation.expectedStatus &&
    evaluation.expectedStatus !== subscription.status
  ) {
    await prisma.merchantSubscription.update({
      where: { id: subscription.id },
      data: { status: evaluation.expectedStatus },
    });
  }
  return evaluation;
}

export async function hasMerchantSubscriptionAccess(merchantId: string) {
  const subscription = await prisma.merchantSubscription.findUnique({
    where: { merchantId },
    select: { id: true, status: true, currentPeriodEnd: true },
  });
  if (!subscription) return false;
  return (await synchronizeSubscription(subscription)).hasAccess;
}

export async function requireMerchantSubscriptionAccess(merchantId: string) {
  if (!(await hasMerchantSubscriptionAccess(merchantId))) {
    throw new ApiException(
      "This merchant subscription is inactive or expired. Record a payment or assign an active plan to restore access.",
      402,
    );
  }
}

export async function getAccessibleMerchantIdsForUser(userId: string) {
  const memberships = await prisma.merchantMember.findMany({
    where: {
      userId,
      merchant: { deletedAt: null },
    },
    select: {
      merchantId: true,
      merchant: {
        select: {
          subscription: {
            select: { id: true, status: true, currentPeriodEnd: true },
          },
        },
      },
    },
  });

  const evaluations = await Promise.all(
    memberships.map(async (membership) => ({
      merchantId: membership.merchantId,
      hasAccess: membership.merchant.subscription
        ? (await synchronizeSubscription(membership.merchant.subscription))
            .hasAccess
        : false,
    })),
  );

  return evaluations
    .filter((evaluation) => evaluation.hasAccess)
    .map((evaluation) => evaluation.merchantId);
}

export async function requireUserSubscriptionAccess(userId: string) {
  const merchantIds = await getAccessibleMerchantIdsForUser(userId);
  if (!merchantIds.length) {
    throw new ApiException(
      "Your merchant subscription is inactive or expired. Contact the platform administrator to restore access.",
      402,
    );
  }
  return merchantIds;
}
