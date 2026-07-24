"use client";

import * as React from "react";
import {
  CircleOffIcon,
  ImageIcon,
  PackageOpenIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatStorePrice } from "../format";
import {
  createStoreProduct,
  deleteStoreProduct,
  getMerchantStores,
  getStoreCategories,
  getStoreProducts,
  updateStoreProduct,
} from "../stores-api";
import { Category, Product, ProductInput, Store } from "../types";
import { ProductEditor } from "./product-editor";

export function ProductManager() {
  const [selectedStore, setSelectedStore] = React.useState<Store | null>(null);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [query, setQuery] = React.useState("");
  const [availability, setAvailability] = React.useState<
    "all" | "available" | "hidden"
  >("all");
  const [editing, setEditing] = React.useState<Product | "new" | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [message, setMessage] = React.useState("");

  React.useEffect(() => {
    getMerchantStores()
      .then((data) => setSelectedStore(data[0] ?? null))
      .catch((error: Error) => setMessage(error.message));
  }, []);

  React.useEffect(() => {
    if (!selectedStore) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    Promise.all([
      getStoreProducts(selectedStore.id, { signal: controller.signal }),
      getStoreCategories(selectedStore.id, { signal: controller.signal }),
    ])
      .then(([productData, categoryData]) => {
        setProducts(productData);
        setCategories(categoryData);
      })
      .catch((error: Error) => {
        if (error.name !== "AbortError") setMessage(error.message);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [selectedStore]);

  const storeId = selectedStore?.id ?? "";
  const filtered = products.filter((product) => {
    const matchesQuery = `${product.name} ${product.description ?? ""}`
      .toLowerCase()
      .includes(query.toLowerCase());
    const matchesStatus =
      availability === "all" ||
      (availability === "available"
        ? product.isAvailable
        : !product.isAvailable);
    return matchesQuery && matchesStatus;
  });

  async function toggleAvailability(product: Product) {
    try {
      const updated = await updateStoreProduct(storeId, product.id, {
        isAvailable: !product.isAvailable,
      });
      setProducts((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to update item",
      );
    }
  }

  async function removeProduct(product: Product) {
    if (!window.confirm(`Delete “${product.name}”? This cannot be undone.`))
      return;
    try {
      await deleteStoreProduct(storeId, product.id);
      setProducts((current) =>
        current.filter((item) => item.id !== product.id),
      );
      setMessage("Item deleted");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to delete item",
      );
    }
  }

  async function saveProduct(input: ProductInput) {
    const saved =
      editing === "new"
        ? await createStoreProduct(storeId, input)
        : await updateStoreProduct(storeId, editing!.id, input);
    setProducts((current) =>
      editing === "new"
        ? [saved, ...current]
        : current.map((item) => (item.id === saved.id ? saved : item)),
    );
    setEditing(null);
    setMessage(editing === "new" ? "Item added to your store" : "Item updated");
  }

  if (!selectedStore && !loading)
    return (
      <EmptyState
        title="No store assigned"
        body="Create or request a store before adding products."
      />
    );

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="flex flex-col gap-5 bg-zinc-950 p-5 text-white sm:flex-row sm:items-center sm:justify-between md:p-7">
          <div>
            <p className="text-sm text-white/60">Storefront catalog</p>
            <h2 className="mt-1 text-2xl font-semibold">
              {selectedStore?.name ?? "Select a store"}
            </h2>
            <p className="mt-2 text-sm text-white/60">
              {products.length} items ·{" "}
              {products.filter((p) => p.isAvailable).length} visible to
              customers
            </p>
          </div>
          <Button
            className="bg-white text-zinc-950 hover:bg-white/90"
            onClick={() => setEditing("new")}
            disabled={!storeId}
          >
            <PlusIcon /> Add new item
          </Button>
        </div>
        <div className="grid gap-3 p-4 md:grid-cols-[1fr_auto] md:p-5">
          <label className="relative">
            <SearchIcon className="absolute left-3 top-3 size-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search products or descriptions…"
              className="pl-9"
            />
          </label>
          <div className="flex rounded-lg bg-muted p-1 text-sm">
            {(["all", "available", "hidden"] as const).map((value) => (
              <button
                key={value}
                onClick={() => setAvailability(value)}
                className={`rounded-md px-3 py-1.5 capitalize ${availability === value ? "bg-background font-medium shadow-sm" : "text-muted-foreground"}`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      </section>

      {message ? (
        <p className="rounded-lg border bg-card px-4 py-3 text-sm">{message}</p>
      ) : null}
      {loading ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Loading your catalog…
        </p>
      ) : filtered.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((product) => (
            <article
              key={product.id}
              className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-[16/10] bg-muted">
                {product.imageUrl ? (
                  <div
                    role="img"
                    aria-label={product.name}
                    className="size-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${product.imageUrl})` }}
                  />
                ) : (
                  <div className="flex size-full items-center justify-center">
                    <ImageIcon className="size-9 text-muted-foreground/50" />
                  </div>
                )}
                <span
                  className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-medium ${product.isAvailable ? "bg-emerald-500 text-white" : "bg-zinc-800 text-white"}`}
                >
                  {product.isAvailable ? "Available" : "Hidden"}
                </span>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{product.name}</h3>
                    <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                      {product.category?.name ?? "Uncategorized"}
                    </p>
                    <p className="mt-1 line-clamp-2 min-h-10 text-sm text-muted-foreground">
                      {product.description || "No description added"}
                    </p>
                  </div>
                  <p className="font-semibold">
                    {formatStorePrice(
                      product.price,
                      selectedStore?.currency ?? "USD",
                      Number(selectedStore?.exchangeRate ?? 1),
                    )}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between border-t pt-3">
                  <Button
                    type="button"
                    size="sm"
                    variant={product.isAvailable ? "outline" : "default"}
                    onClick={() => toggleAvailability(product)}
                    className={
                      product.isAvailable
                        ? "text-destructive hover:bg-destructive/10 hover:text-destructive"
                        : ""
                    }
                  >
                    <CircleOffIcon />
                    {product.isAvailable ? "Mark sold out" : "Back on menu"}
                  </Button>
                  <div className="flex gap-1">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => setEditing(product)}
                      aria-label="Edit item"
                    >
                      <PencilIcon />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => removeProduct(product)}
                      aria-label="Delete item"
                      className="text-destructive"
                    >
                      <Trash2Icon />
                    </Button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No items found"
          body={
            query || availability !== "all"
              ? "Try changing your search or filters."
              : "Add your first item to begin building your storefront."
          }
        />
      )}

      {editing ? (
        <ProductEditor
          product={editing === "new" ? null : editing}
          currency={selectedStore?.currency ?? "USD"}
          categories={categories.filter((category) => category.isActive)}
          onClose={() => setEditing(null)}
          onSave={saveProduct}
        />
      ) : null}
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <section className="rounded-2xl border border-dashed bg-card p-12 text-center">
      <PackageOpenIcon className="mx-auto size-9 text-muted-foreground" />
      <h2 className="mt-3 font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </section>
  );
}
