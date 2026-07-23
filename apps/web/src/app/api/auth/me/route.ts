import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/server/api-response";
import { requireRequestUser } from "@/lib/server/session";

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(await requireRequestUser(request));
  } catch (error) {
    return handleApiError(error);
  }
}
