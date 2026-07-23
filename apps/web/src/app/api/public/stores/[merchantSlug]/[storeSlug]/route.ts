import { NextRequest, NextResponse } from "next/server";
import { ApiException, handleApiError } from "@/lib/server/api-response";
import { findPublicStore } from "@/features/stores/server";

type PublicStoreContext = {
  params: Promise<{ merchantSlug: string; storeSlug: string }>;
};

export async function GET(_request: NextRequest, context: PublicStoreContext) {
  try {
    const { merchantSlug, storeSlug } = await context.params;
    const store = await findPublicStore(merchantSlug, storeSlug);
    if (!store) throw new ApiException("Storefront not found", 404);
    return NextResponse.json(store);
  } catch (error) {
    return handleApiError(error);
  }
}
