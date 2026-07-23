import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "healthy",
      database: "connected",
      checkedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      {
        status: "unhealthy",
        database: "unavailable",
        checkedAt: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
