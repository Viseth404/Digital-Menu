"use client";

import * as React from "react";
import {
  FolderPlusIcon,
  GripVerticalIcon,
  PencilIcon,
  PlusIcon,
  TagsIcon,
  Trash2Icon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import {
  createStoreCategory,
  deleteStoreCategory,
  getMerchantStores,
  getStoreCategories,
  updateStoreCategory,
} from "../stores-api";
import { Category, CategoryInput } from "../types";
import { CategoryEditor } from "./category-editor";

export function CategoryManager() {
  const [storeId, setStoreId] = React.useState("");
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [editing, setEditing] = React.useState<Category | "new" | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [message, setMessage] = React.useState("");
  React.useEffect(() => {
    getMerchantStores()
      .then((data) => {
        setStoreId(data[0]?.id ?? "");
      })
      .catch((error: Error) => setMessage(error.message));
  }, []);
  React.useEffect(() => {
    if (!storeId) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    getStoreCategories(storeId, { signal: controller.signal })
      .then(setCategories)
      .catch((error: Error) => {
        if (error.name !== "AbortError") setMessage(error.message);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [storeId]);
  async function save(input: CategoryInput) {
    const result =
      editing === "new"
        ? await createStoreCategory(storeId, input)
        : await updateStoreCategory(storeId, editing!.id, input);
    setCategories((current) =>
      editing === "new"
        ? [...current, result]
        : current.map((item) => (item.id === result.id ? result : item)),
    );
    setEditing(null);
    showSuccessToast(
      editing === "new" ? "Category created" : "Category updated",
      result.name,
    );
  }
  async function toggle(category: Category) {
    try {
      const result = await updateStoreCategory(storeId, category.id, {
        isActive: !category.isActive,
      });
      setCategories((current) =>
        current.map((item) => (item.id === result.id ? result : item)),
      );
      showSuccessToast(
        result.isActive ? "Category is visible" : "Category hidden",
        result.name,
      );
    } catch (error) {
      showErrorToast(
        "Unable to update category",
        error instanceof Error ? error.message : undefined,
      );
    }
  }
  async function remove(category: Category) {
    if (
      !window.confirm(
        `Delete “${category.name}”? Its products will become uncategorized.`,
      )
    )
      return;
    try {
      await deleteStoreCategory(storeId, category.id);
      setCategories((current) =>
        current.filter((item) => item.id !== category.id),
      );
      showSuccessToast(
        "Category deleted",
        "Its products are now uncategorized.",
      );
    } catch (error) {
      showErrorToast(
        "Unable to delete category",
        error instanceof Error ? error.message : undefined,
      );
    }
  }
  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-5 rounded-2xl border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between md:p-7">
        <div>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <TagsIcon className="size-4" /> Menu organization
          </p>
          <h2 className="mt-1 text-xl font-semibold">
            Group products into categories
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Categories appear as sections on your public storefront.
          </p>
        </div>
        <Button onClick={() => setEditing("new")} disabled={!storeId}>
          <PlusIcon /> New category
        </Button>
      </section>
      <p className="text-sm text-muted-foreground">
        {categories.length} categories ·{" "}
        {categories.reduce((sum, item) => sum + item._count.products, 0)}{" "}
        assigned items
      </p>
      {message ? (
        <p className="rounded-lg border bg-card px-4 py-3 text-sm">{message}</p>
      ) : null}
      {loading ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Loading categories…
        </p>
      ) : categories.length ? (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          {categories.map((category, index) => (
            <div
              key={category.id}
              className="flex items-center gap-3 border-b p-4 last:border-b-0 sm:p-5"
            >
              <GripVerticalIcon className="size-4 text-muted-foreground/50" />
              <div className="flex size-10 items-center justify-center rounded-xl bg-muted font-semibold">
                {index + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate font-semibold">{category.name}</h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${category.isActive ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-600"}`}
                  >
                    {category.isActive ? "Visible" : "Hidden"}
                  </span>
                </div>
                <p className="truncate text-sm text-muted-foreground">
                  {category.description || "No description"} ·{" "}
                  {category._count.products} items
                </p>
              </div>
              <button
                onClick={() => toggle(category)}
                className="hidden text-xs font-medium text-muted-foreground hover:text-foreground sm:block"
              >
                {category.isActive ? "Hide" : "Show"}
              </button>
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => setEditing(category)}
              >
                <PencilIcon />
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                className="text-destructive"
                onClick={() => remove(category)}
              >
                <Trash2Icon />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <section className="rounded-2xl border border-dashed bg-card p-12 text-center">
          <FolderPlusIcon className="mx-auto size-9 text-muted-foreground" />
          <h2 className="mt-3 font-semibold">Create your first category</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Try categories like Popular, Main dishes, Drinks, or Desserts.
          </p>
        </section>
      )}
      {editing ? (
        <CategoryEditor
          category={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      ) : null}
    </div>
  );
}
