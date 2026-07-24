import { unlink } from "node:fs/promises";
import path from "node:path";
import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { writeAdminAudit } from "@/features/admin-support/server/audit";
import { ApiException, handleApiError } from "@/lib/server/api-response";
import { prisma } from "@/lib/server/prisma";
import { requireRequestUser } from "@/lib/server/session";
import {
  getReferencedUploadUrls,
  getUploadDirectory,
  UPLOAD_FILENAME_PATTERN,
} from "@/lib/server/upload-storage";

type Context = { params: Promise<{ filename: string }> };

export async function DELETE(request: NextRequest, context: Context) {
  try {
    const admin = await requireRequestUser(request, [UserRole.ADMIN]);
    const { filename } = await context.params;
    if (!UPLOAD_FILENAME_PATTERN.test(filename)) {
      throw new ApiException("Invalid upload filename", 400);
    }

    const url = `/uploads/${filename}`;
    const referenced = new Set(await getReferencedUploadUrls());
    if (referenced.has(url)) {
      throw new ApiException(
        "This image is currently used by a store or product and cannot be deleted",
        409,
      );
    }

    try {
      await unlink(path.join(getUploadDirectory(), filename));
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        throw new ApiException("Upload file was not found", 404);
      }
      throw error;
    }

    await writeAdminAudit(prisma, {
      adminId: admin.id,
      action: "ORPHANED_UPLOAD_DELETED",
      targetType: "UPLOAD",
      targetId: filename,
      targetName: filename,
      details: { url },
      request,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
