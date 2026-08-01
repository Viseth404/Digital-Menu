"use client";

import * as React from "react";
import { ImageIcon, Trash2Icon, UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IMAGE_ACCEPT } from "../constants";
import { uploadMerchantImage } from "../stores-api";

type ImageUploadFieldProps = {
  label: string;
  name: string;
  storeId: string;
  defaultValue?: string | null;
  description?: string;
  aspect?: "square" | "cover" | "product";
  allowBackgroundRemoval?: boolean;
};

const aspectClasses = {
  square: "aspect-square max-w-36",
  cover: "aspect-[3/1]",
  product: "aspect-[16/10]",
};

export function ImageUploadField({
  label,
  name,
  storeId,
  defaultValue,
  description = "JPG, PNG, WebP, or GIF. Maximum 5 MB.",
  aspect = "product",
  allowBackgroundRemoval = false,
}: ImageUploadFieldProps) {
  const inputId = React.useId();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [url, setUrl] = React.useState(defaultValue ?? "");
  const [isUploading, setIsUploading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [removeBackground, setRemoveBackground] = React.useState(false);

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError("");
    try {
      const result = await uploadMerchantImage(file, {
        storeId,
        removeBackground,
      });
      setUrl(result.url);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Upload failed");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  return (
    <div className="grid gap-2 sm:col-span-2">
      <span className="text-sm font-medium">{label}</span>
      <input type="hidden" name={name} value={url} />
      <div
        className={`relative w-full overflow-hidden rounded-xl border bg-muted ${aspectClasses[aspect]}`}
      >
        {url ? (
          <div
            role="img"
            aria-label={`${label} preview`}
            className="size-full bg-cover bg-center"
            style={{ backgroundImage: `url(${url})` }}
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageIcon className="size-8" />
            <span className="text-xs">No image uploaded</span>
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadIcon /> {isUploading ? "Uploading…" : "Choose image"}
        </Button>
        {url ? (
          <Button type="button" variant="ghost" onClick={() => setUrl("")}>
            <Trash2Icon /> Remove
          </Button>
        ) : null}
        <input
          id={inputId}
          ref={fileInputRef}
          type="file"
          accept={IMAGE_ACCEPT}
          className="sr-only"
          onChange={handleFile}
          disabled={isUploading}
        />
        {allowBackgroundRemoval ? (
          <label className="ml-auto flex cursor-pointer items-center gap-3 rounded-full border bg-background px-4 py-2 shadow-sm">
            <input
              type="checkbox"
              checked={removeBackground}
              onChange={(event) => setRemoveBackground(event.target.checked)}
              disabled={isUploading}
              className="peer sr-only"
            />
            <span className="relative h-6 w-11 rounded-full bg-muted transition peer-checked:bg-foreground peer-disabled:opacity-50 after:absolute after:left-1 after:top-1 after:size-4 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:after:translate-x-5" />
            <span className="text-sm font-semibold">Remove BG</span>
          </label>
        ) : null}
      </div>
      {allowBackgroundRemoval && removeBackground ? (
        <p className="text-xs text-muted-foreground">
          The background will be replaced automatically with clean white.
        </p>
      ) : null}
      <p className="text-xs text-muted-foreground">{description}</p>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
