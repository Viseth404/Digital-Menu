import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const contentTypes: Record<string, string> = {
  ".gif": "image/gif",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

type Context = { params: Promise<{ filename: string }> };

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: Context) {
  const { filename } = await context.params;
  const extension = path.extname(filename).toLowerCase();

  if (
    !/^[a-f0-9-]+\.(gif|jpe?g|png|webp)$/i.test(filename) ||
    !contentTypes[extension]
  ) {
    return new NextResponse("Image not found", { status: 404 });
  }

  try {
    const uploadDirectory =
      process.env.UPLOAD_DIRECTORY ??
      path.join(process.cwd(), "public", "uploads");
    const image = await readFile(path.join(uploadDirectory, filename));

    return new NextResponse(image, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Type": contentTypes[extension],
        "Content-Length": String(image.byteLength),
      },
    });
  } catch {
    return new NextResponse("Image not found", { status: 404 });
  }
}
