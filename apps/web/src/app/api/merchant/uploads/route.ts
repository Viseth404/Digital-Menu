import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { ApiException, handleApiError } from "@/lib/server/api-response";
import { requireRequestUser } from "@/lib/server/session";
import { getPlatformOperationalSettings } from "@/features/admin-support/server/settings";

const imageExtensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function POST(request: NextRequest) {
  try {
    await requireRequestUser(request, [UserRole.MERCHANT]);
    const settings = await getPlatformOperationalSettings();
    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      throw new ApiException("Choose an image to upload", 400);
    }

    const extension = imageExtensions[file.type];
    if (!extension) {
      throw new ApiException("Use a JPG, PNG, WebP, or GIF image", 400);
    }
    if (file.size === 0 || file.size > settings.uploadLimitMb * 1024 * 1024) {
      throw new ApiException(
        `Image must be smaller than ${settings.uploadLimitMb} MB`,
        400,
      );
    }

    const filename = `${randomUUID()}.${extension}`;
    const uploadDirectory =
      process.env.UPLOAD_DIRECTORY ??
      path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDirectory, { recursive: true });
    await writeFile(
      path.join(uploadDirectory, filename),
      Buffer.from(await file.arrayBuffer()),
      { flag: "wx" },
    );

    return NextResponse.json({ url: `/uploads/${filename}` }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
