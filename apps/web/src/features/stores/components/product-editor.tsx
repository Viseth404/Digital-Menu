"use client";

import * as React from "react";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Category, Product, ProductInput } from "../types";
import { ImageUploadField } from "./image-upload-field";

type ProductEditorProps = {
  product: Product | null;
  currency: string;
  categories: Category[];
  onClose: () => void;
  onSave: (input: ProductInput) => Promise<void>;
};

export function ProductEditor({
  product,
  currency,
  categories,
  onClose,
  onSave,
}: ProductEditorProps) {
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setError("");
    try {
      await onSave({
        name: String(form.get("name")),
        description: String(form.get("description") || "") || null,
        price: Number(form.get("price")),
        imageUrl: String(form.get("imageUrl") || "") || null,
        categoryId: String(form.get("categoryId") || "") || null,
        isAvailable: form.get("isAvailable") === "on",
        sortOrder: Number(form.get("sortOrder")),
      });
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to save item",
      );
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/45"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <form
        onSubmit={submit}
        className="h-full w-full max-w-lg overflow-y-auto bg-background p-6 shadow-2xl"
      >
        <header className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Storefront item</p>
            <h2 className="text-xl font-semibold">
              {product ? "Edit item" : "Add new item"}
            </h2>
          </div>
          <Button type="button" size="icon" variant="ghost" onClick={onClose}>
            <XIcon />
          </Button>
        </header>
        <div className="mt-7 grid gap-5">
          <Field label="Item name">
            <Input
              name="name"
              defaultValue={product?.name}
              required
              minLength={2}
              placeholder="e.g. Classic beef burger"
            />
          </Field>
          <Field
            label={
              currency === "USD"
                ? "Price (USD)"
                : `Base price (USD) · shown in ${currency}`
            }
          >
            <Input
              name="price"
              type="number"
              min="0.01"
              step="0.01"
              defaultValue={product?.price}
              required
            />
          </Field>
          <Field label="Category">
            <select
              name="categoryId"
              defaultValue={product?.categoryId ?? ""}
              className="h-9 rounded-md border bg-transparent px-3 text-sm"
            >
              <option value="">Uncategorized</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Description">
            <textarea
              name="description"
              defaultValue={product?.description ?? ""}
              rows={4}
              placeholder="Tell customers what makes this item special"
              className="rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </Field>
          <ImageUploadField
            label="Product image"
            name="imageUrl"
            defaultValue={product?.imageUrl}
            aspect="product"
          />
          <Field label="Display order">
            <Input
              name="sortOrder"
              type="number"
              min="0"
              step="1"
              defaultValue={product?.sortOrder ?? 0}
            />
          </Field>
          <label className="flex items-center justify-between rounded-xl border p-4">
            <span>
              <span className="block text-sm font-medium">
                Available on storefront
              </span>
              <span className="text-xs text-muted-foreground">
                Customers can see this item
              </span>
            </span>
            <input
              name="isAvailable"
              type="checkbox"
              defaultChecked={product?.isAvailable ?? true}
              className="size-4"
            />
          </label>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
        <footer className="mt-8 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : product ? "Save changes" : "Add item"}
          </Button>
        </footer>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      {label}
      {children}
    </label>
  );
}
