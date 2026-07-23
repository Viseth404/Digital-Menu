"use client";

import * as React from "react";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Category, CategoryInput } from "../types";

type CategoryEditorProps = {
  category: Category | null;
  onClose: () => void;
  onSave: (input: CategoryInput) => Promise<void>;
};

export function CategoryEditor({
  category,
  onClose,
  onSave,
}: CategoryEditorProps) {
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
        sortOrder: Number(form.get("sortOrder")),
        isActive: form.get("isActive") === "on",
      });
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to save category",
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
        className="h-full w-full max-w-md bg-background p-6 shadow-2xl"
      >
        <header className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Menu group</p>
            <h2 className="text-xl font-semibold">
              {category ? "Edit category" : "New category"}
            </h2>
          </div>
          <Button type="button" size="icon" variant="ghost" onClick={onClose}>
            <XIcon />
          </Button>
        </header>
        <div className="mt-7 grid gap-5">
          <Field label="Category name">
            <Input
              name="name"
              defaultValue={category?.name}
              required
              minLength={2}
              placeholder="e.g. Cold drinks"
            />
          </Field>
          <Field label="Description">
            <textarea
              name="description"
              defaultValue={category?.description ?? ""}
              rows={4}
              className="rounded-md border bg-transparent px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Display order">
            <Input
              name="sortOrder"
              type="number"
              min="0"
              step="1"
              defaultValue={category?.sortOrder ?? 0}
            />
          </Field>
          <label className="flex items-center justify-between rounded-xl border p-4 text-sm font-medium">
            Visible on storefront
            <input
              name="isActive"
              type="checkbox"
              defaultChecked={category?.isActive ?? true}
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
            {saving ? "Saving…" : "Save category"}
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
