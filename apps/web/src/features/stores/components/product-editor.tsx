"use client";

import * as React from "react";
import { PlusIcon, Trash2Icon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Category, Product, ProductInput, ProductOptionGroup } from "../types";
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
  const [optionGroups, setOptionGroups] = React.useState<ProductOptionGroup[]>(
    () =>
      product?.optionGroups.map((group) => ({
        ...group,
        options: group.options.map((option) => ({
          ...option,
          priceDelta: Number(option.priceDelta),
        })),
      })) ?? [],
  );

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setError("");
    try {
      await onSave({
        name: String(form.get("name")),
        nameKh: String(form.get("nameKh") || "") || null,
        description: String(form.get("description") || "") || null,
        descriptionKh: String(form.get("descriptionKh") || "") || null,
        price: Number(form.get("price")),
        imageUrl: String(form.get("imageUrl") || "") || null,
        categoryId: String(form.get("categoryId") || "") || null,
        isAvailable: form.get("isAvailable") === "on",
        sortOrder: Number(form.get("sortOrder")),
        optionGroups,
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
          <Field label="Khmer item name (optional)">
            <Input
              name="nameKh"
              lang="km"
              defaultValue={product?.nameKh ?? ""}
              placeholder="ឧ. ប៊ឺហ្គឺរសាច់គោ"
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
          <Field label="Khmer description (optional)">
            <textarea
              name="descriptionKh"
              lang="km"
              defaultValue={product?.descriptionKh ?? ""}
              rows={3}
              placeholder="ពិពណ៌នាមុខម្ហូបជាភាសាខ្មែរ"
              className="rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </Field>
          <OptionGroupEditor groups={optionGroups} onChange={setOptionGroups} />
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

function OptionGroupEditor({
  groups,
  onChange,
}: {
  groups: ProductOptionGroup[];
  onChange: (groups: ProductOptionGroup[]) => void;
}) {
  function updateGroup(
    groupIndex: number,
    update: (group: ProductOptionGroup) => ProductOptionGroup,
  ) {
    onChange(
      groups.map((group, index) =>
        index === groupIndex ? update(group) : group,
      ),
    );
  }

  return (
    <section className="rounded-2xl border p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Choices and modifiers</h3>
          <p className="text-xs text-muted-foreground">
            Add sizes, temperatures, toppings, or extras.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() =>
            onChange([
              ...groups,
              {
                name: "",
                nameKh: null,
                required: false,
                minSelections: 0,
                maxSelections: 1,
                sortOrder: groups.length,
                options: [
                  {
                    name: "",
                    nameKh: null,
                    priceDelta: 0,
                    isAvailable: true,
                    sortOrder: 0,
                  },
                ],
              },
            ])
          }
        >
          <PlusIcon /> Group
        </Button>
      </div>

      <div className="mt-4 space-y-4">
        {groups.map((group, groupIndex) => (
          <div
            key={group.id ?? groupIndex}
            className="rounded-xl bg-muted/50 p-3"
          >
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                value={group.name}
                placeholder="Group name, e.g. Size"
                aria-label={`Option group ${groupIndex + 1} name`}
                onChange={(event) =>
                  updateGroup(groupIndex, (current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
              <Input
                value={group.nameKh ?? ""}
                lang="km"
                placeholder="ឈ្មោះក្រុមជាភាសាខ្មែរ"
                aria-label={`Option group ${groupIndex + 1} Khmer name`}
                onChange={(event) =>
                  updateGroup(groupIndex, (current) => ({
                    ...current,
                    nameKh: event.target.value || null,
                  }))
                }
              />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={group.required}
                  onChange={(event) =>
                    updateGroup(groupIndex, (current) => ({
                      ...current,
                      required: event.target.checked,
                      minSelections: event.target.checked ? 1 : 0,
                    }))
                  }
                />
                Required
              </label>
              <label className="flex items-center gap-2">
                Maximum choices
                <Input
                  type="number"
                  min="1"
                  max={Math.max(1, group.options.length)}
                  value={group.maxSelections}
                  className="h-8 w-16"
                  onChange={(event) =>
                    updateGroup(groupIndex, (current) => ({
                      ...current,
                      maxSelections: Math.max(1, Number(event.target.value)),
                    }))
                  }
                />
              </label>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                className="ml-auto text-destructive"
                aria-label={`Delete ${group.name || "option group"}`}
                onClick={() =>
                  onChange(groups.filter((_, index) => index !== groupIndex))
                }
              >
                <Trash2Icon />
              </Button>
            </div>

            <div className="mt-3 space-y-2">
              {group.options.map((option, optionIndex) => (
                <div
                  key={option.id ?? optionIndex}
                  className="grid grid-cols-[1fr_5rem_auto] gap-2"
                >
                  <Input
                    value={option.name}
                    placeholder="Choice name"
                    aria-label={`Choice ${optionIndex + 1} name`}
                    onChange={(event) =>
                      updateGroup(groupIndex, (current) => ({
                        ...current,
                        options: current.options.map((item, index) =>
                          index === optionIndex
                            ? { ...item, name: event.target.value }
                            : item,
                        ),
                      }))
                    }
                  />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={option.priceDelta}
                    aria-label={`Choice ${optionIndex + 1} additional price`}
                    onChange={(event) =>
                      updateGroup(groupIndex, (current) => ({
                        ...current,
                        options: current.options.map((item, index) =>
                          index === optionIndex
                            ? {
                                ...item,
                                priceDelta: Math.max(
                                  0,
                                  Number(event.target.value),
                                ),
                              }
                            : item,
                        ),
                      }))
                    }
                  />
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Delete choice ${option.name}`}
                    disabled={group.options.length === 1}
                    onClick={() =>
                      updateGroup(groupIndex, (current) => ({
                        ...current,
                        options: current.options.filter(
                          (_, index) => index !== optionIndex,
                        ),
                        maxSelections: Math.min(
                          current.maxSelections,
                          current.options.length - 1,
                        ),
                      }))
                    }
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() =>
                  updateGroup(groupIndex, (current) => ({
                    ...current,
                    options: [
                      ...current.options,
                      {
                        name: "",
                        nameKh: null,
                        priceDelta: 0,
                        isAvailable: true,
                        sortOrder: current.options.length,
                      },
                    ],
                  }))
                }
              >
                <PlusIcon /> Add choice
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
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
