import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { ApiException, handleApiError } from "@/lib/server/api-response";
import { requireRequestUser } from "@/lib/server/session";
import {
  getPlatformOperationalSettings,
  getPlatformServiceCredentials,
} from "@/features/admin-support/server/settings";

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
    const removeBackground = form.get("removeBackground") === "true";

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

    let contents = Buffer.from(await file.arrayBuffer());
    let outputExtension = extension;
    if (removeBackground) {
      const { removeBgApiKey: apiKey } = await getPlatformServiceCredentials();
      if (!apiKey) {
        throw new ApiException(
          "Background removal is not configured. Ask Restaurant Admin to add the remove.bg API key.",
          503,
        );
      }
      const removalForm = new FormData();
      removalForm.set("size", "auto");
      removalForm.set("format", "png");
      removalForm.set("bg_color", "ffffff");
      removalForm.set("image_file", file, file.name);
      const response = await fetch("https://api.remove.bg/v1.0/removebg", {
        method: "POST",
        headers: { "X-Api-Key": apiKey },
        body: removalForm,
        signal: AbortSignal.timeout(30_000),
      });
      if (!response.ok) {
        console.error("Background removal failed", response.status);
        throw new ApiException(
          response.status === 402 || response.status === 429
            ? "Background removal credits are unavailable. Try again later."
            : "Unable to remove this image background",
          502,
        );
      }
      contents = Buffer.from(await response.arrayBuffer());
      outputExtension = "png";
    }

    const filename = `${randomUUID()}.${outputExtension}`;
    const uploadDirectory =
      process.env.UPLOAD_DIRECTORY ??
      path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDirectory, { recursive: true });
    await writeFile(path.join(uploadDirectory, filename), contents, {
      flag: "wx",
    });

    return NextResponse.json({ url: `/uploads/${filename}` }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
