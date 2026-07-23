import { OrderStatus, UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/server/api-response";
import { prisma } from "@/lib/server/prisma";
import { requireRequestUser } from "@/lib/server/session";

export async function GET(request: NextRequest) {
  try {
    await requireRequestUser(request, [UserRole.ADMIN]);
    const merchants = await prisma.merchant.findMany({
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                isActive: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        stores: {
          include: {
            _count: {
              select: {
                products: true,
                categories: true,
                tables: true,
                orders: true,
              },
            },
            orders: {
              where: {
                status: {
                  in: [
                    OrderStatus.PENDING,
                    OrderStatus.CONFIRMED,
                    OrderStatus.PREPARING,
                    OrderStatus.READY,
                  ],
                },
              },
              select: { id: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      merchants.map((merchant) => ({
        id: merchant.id,
        name: merchant.name,
        slug: merchant.slug,
        status: merchant.status,
        contactEmail: merchant.contactEmail,
        phone: merchant.phone,
        createdAt: merchant.createdAt,
        updatedAt: merchant.updatedAt,
        users: merchant.members.map((member) => ({
          membershipId: member.id,
          id: member.user.id,
          name: member.user.name,
          email: member.user.email,
          role: member.role,
          isActive: member.user.isActive,
        })),
        stores: merchant.stores.map((store) => {
          const diagnostics = getStoreDiagnostics(store);
          return {
            id: store.id,
            name: store.name,
            slug: store.slug,
            status: store.status,
            isPublished: store.isPublished,
            currency: store.currency,
            updatedAt: store.updatedAt,
            counts: {
              products: store._count.products,
              categories: store._count.categories,
              tables: store._count.tables,
              orders: store._count.orders,
              activeOrders: store.orders.length,
            },
            diagnostics,
          };
        }),
        diagnostics: getMerchantDiagnostics(merchant),
      })),
    );
  } catch (error) {
    return handleApiError(error);
  }
}

function getStoreDiagnostics(store: {
  status: string;
  isPublished: boolean;
  logoUrl: string | null;
  coverImageUrl: string | null;
  _count: {
    products: number;
    categories: number;
    tables: number;
    orders: number;
  };
}) {
  const diagnostics: string[] = [];
  if (store.status !== "ACTIVE") diagnostics.push("Store is inactive");
  if (!store.isPublished) diagnostics.push("Storefront is not published");
  if (!store._count.products) diagnostics.push("No products configured");
  if (!store._count.categories) diagnostics.push("No categories configured");
  if (!store._count.tables) diagnostics.push("No table QR codes");
  if (!store.logoUrl) diagnostics.push("Store logo is missing");
  if (!store.coverImageUrl) diagnostics.push("Cover image is missing");
  return diagnostics;
}

function getMerchantDiagnostics(merchant: {
  status: string;
  members: Array<{ user: { isActive: boolean } }>;
  stores: Array<unknown>;
}) {
  const diagnostics: string[] = [];
  if (merchant.status !== "ACTIVE") {
    diagnostics.push(`Merchant is ${merchant.status.toLowerCase()}`);
  }
  if (!merchant.members.some((member) => member.user.isActive)) {
    diagnostics.push("No active merchant users");
  }
  if (!merchant.stores.length) diagnostics.push("No stores created");
  return diagnostics;
}
