import { ApiException } from "./api-response";

export function readObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ApiException("Invalid request body", 400);
  }
  return value as Record<string, unknown>;
}

export function readString(
  object: Record<string, unknown>,
  key: string,
  options: { min?: number; optional?: boolean } = {},
): string | undefined {
  const value = object[key];
  if (
    (value === undefined || value === null || value === "") &&
    options.optional
  ) {
    return undefined;
  }
  if (typeof value !== "string" || value.trim().length < (options.min ?? 1)) {
    throw new ApiException(`${key} is invalid`, 400);
  }
  return value.trim();
}

export function readNullableString(
  object: Record<string, unknown>,
  key: string,
): string | null | undefined {
  if (!(key in object)) return undefined;
  const value = object[key];
  if (value === null || value === "") return null;
  if (typeof value !== "string")
    throw new ApiException(`${key} is invalid`, 400);
  return value.trim();
}

export function readBoolean(object: Record<string, unknown>, key: string) {
  const value = object[key];
  if (value === undefined) return undefined;
  if (typeof value !== "boolean")
    throw new ApiException(`${key} is invalid`, 400);
  return value;
}

export function readNumber(object: Record<string, unknown>, key: string) {
  const value = object[key];
  if (value === undefined) return undefined;
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new ApiException(`${key} is invalid`, 400);
  }
  return value;
}

export function readNonNegativeNumber(
  object: Record<string, unknown>,
  key: string,
) {
  const value = object[key];
  if (value === undefined) return undefined;
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new ApiException(`${key} is invalid`, 400);
  }
  return value;
}

export function assertEmail(value: string): string {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    throw new ApiException("Email is invalid", 400);
  }
  return value.toLowerCase();
}

export function assertSlug(value: string, field = "slug"): string {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
    throw new ApiException(
      `${field} must use lowercase letters, numbers, and hyphens`,
      400,
    );
  }
  return value;
}

export function assertOptionalUrl(
  value: string | null | undefined,
  field: string,
) {
  if (!value) return value;
  try {
    new URL(value);
    return value;
  } catch {
    throw new ApiException(`${field} must be a valid URL`, 400);
  }
}

export function assertOptionalImageUrl(
  value: string | null | undefined,
  field: string,
) {
  if (!value) return value;

  const isUploadedImage = /^\/uploads\/[0-9a-f-]+\.(?:jpg|png|webp|gif)$/i.test(
    value,
  );
  if (isUploadedImage) return value;

  return assertOptionalUrl(value, field);
}
