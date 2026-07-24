"use client";

import * as React from "react";
import {
  Layers3Icon,
  PlusIcon,
  SlidersHorizontalIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
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
        className="h-full w-full max-w-2xl overflow-y-auto bg-background p-5 shadow-2xl sm:p-7"
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
          <OptionGroupEditor
            groups={optionGroups}
            currency={currency}
            onChange={setOptionGroups}
          />
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
  currency,
  onChange,
}: {
  groups: ProductOptionGroup[];
  currency: string;
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

  function addGroup() {
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
    ]);
  }

  return (
    <section className="overflow-hidden rounded-2xl border bg-muted/20">
      <div className="flex flex-col gap-4 border-b bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-foreground text-background">
            <SlidersHorizontalIcon className="size-4" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">Choices and modifiers</h3>
              {groups.length ? (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                  {groups.length} {groups.length === 1 ? "group" : "groups"}
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
              Add sizes, temperatures, toppings, or paid extras.
            </p>
          </div>
        </div>
        <Button type="button" size="sm" onClick={addGroup}>
          <PlusIcon /> Add group
        </Button>
      </div>

      <div className="space-y-4 p-3 sm:p-4">
        {!groups.length ? (
          <button
            type="button"
            onClick={addGroup}
            className="group grid w-full place-items-center rounded-xl border border-dashed bg-background px-5 py-9 text-center transition hover:border-foreground/30 hover:bg-muted/30 focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <span className="grid size-11 place-items-center rounded-full bg-muted transition group-hover:scale-105">
              <Layers3Icon className="size-5 text-muted-foreground" />
            </span>
            <span className="mt-3 text-sm font-semibold">
              Add your first modifier group
            </span>
            <span className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
              For example: Size, Sugar level, Temperature, or Extra toppings.
            </span>
          </button>
        ) : null}

        {groups.map((group, groupIndex) => {
          const choiceCount = group.options.length;
          return (
            <article
              key={group.id ?? groupIndex}
              className="overflow-hidden rounded-xl border bg-background shadow-sm"
            >
              <header className="flex items-center justify-between gap-3 border-b bg-muted/35 px-4 py-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-foreground text-xs font-bold text-background">
                    {groupIndex + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {group.name || "New modifier group"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {choiceCount} {choiceCount === 1 ? "choice" : "choices"} ·{" "}
                      {group.required ? "Required" : "Optional"}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label={`Delete ${group.name || "option group"}`}
                  onClick={() =>
                    onChange(groups.filter((_, index) => index !== groupIndex))
                  }
                >
                  <Trash2Icon />
                </Button>
              </header>

              <div className="space-y-5 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Group name">
                    <Input
                      value={group.name}
                      placeholder="e.g. Size"
                      aria-label={`Option group ${groupIndex + 1} name`}
                      onChange={(event) =>
                        updateGroup(groupIndex, (current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field label="Khmer name (optional)">
                    <Input
                      value={group.nameKh ?? ""}
                      lang="km"
                      placeholder="ឧ. ទំហំ"
                      aria-label={`Option group ${groupIndex + 1} Khmer name`}
                      onChange={(event) =>
                        updateGroup(groupIndex, (current) => ({
                          ...current,
                          nameKh: event.target.value || null,
                        }))
                      }
                    />
                  </Field>
                </div>

                <div className="grid gap-3 rounded-xl border bg-muted/25 p-3 sm:grid-cols-[1fr_auto] sm:items-center">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={group.required}
                      className="mt-0.5 size-4 accent-foreground"
                      onChange={(event) =>
                        updateGroup(groupIndex, (current) => ({
                          ...current,
                          required: event.target.checked,
                          minSelections: event.target.checked ? 1 : 0,
                        }))
                      }
                    />
                    <span>
                      <span className="block text-sm font-medium">
                        Customer must choose
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        Require at least one selection before ordering.
                      </span>
                    </span>
                  </label>
                  <label className="flex items-center justify-between gap-3 text-xs font-medium sm:justify-start">
                    Maximum choices
                    <Input
                      type="number"
                      min="1"
                      max={Math.max(1, group.options.length)}
                      value={group.maxSelections}
                      className="h-9 w-20 bg-background text-center"
                      onChange={(event) =>
                        updateGroup(groupIndex, (current) => ({
                          ...current,
                          maxSelections: Math.min(
                            current.options.length,
                            Math.max(1, Number(event.target.value)),
                          ),
                        }))
                      }
                    />
                  </label>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold">Choices</h4>
                      <p className="text-[11px] text-muted-foreground">
                        Enter the extra charge in {currency}.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    {group.options.map((option, optionIndex) => (
                      <div
                        key={option.id ?? optionIndex}
                        className="rounded-xl border bg-muted/15 p-3"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-semibold text-muted-foreground">
                            Choice {optionIndex + 1}
                          </span>
                          <label className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                            <input
                              type="checkbox"
                              checked={option.isAvailable}
                              className="size-3.5 accent-foreground"
                              onChange={(event) =>
                                updateGroup(groupIndex, (current) => ({
                                  ...current,
                                  options: current.options.map((item, index) =>
                                    index === optionIndex
                                      ? {
                                          ...item,
                                          isAvailable: event.target.checked,
                                        }
                                      : item,
                                  ),
                                }))
                              }
                            />
                            Available
                          </label>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_7rem_auto]">
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
                            value={option.nameKh ?? ""}
                            lang="km"
                            placeholder="ឈ្មោះជាភាសាខ្មែរ"
                            aria-label={`Choice ${optionIndex + 1} Khmer name`}
                            onChange={(event) =>
                              updateGroup(groupIndex, (current) => ({
                                ...current,
                                options: current.options.map((item, index) =>
                                  index === optionIndex
                                    ? {
                                        ...item,
                                        nameKh: event.target.value || null,
                                      }
                                    : item,
                                ),
                              }))
                            }
                          />
                          <div className="relative">
                            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs text-muted-foreground">
                              +
                            </span>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={option.priceDelta}
                              className="pl-7"
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
                          </div>
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            className="justify-self-end text-muted-foreground hover:text-destructive"
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
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="mt-3 w-full border-dashed"
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
                    <PlusIcon /> Add another choice
                  </Button>
                </div>
              </div>
            </article>
          );
        })}
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
