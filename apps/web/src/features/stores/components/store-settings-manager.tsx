"use client";

import * as React from "react";
import Link from "next/link";
import {
  CheckIcon,
  CopyIcon,
  ExternalLinkIcon,
  Globe2Icon,
  PackageOpenIcon,
  StoreIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPublicStorePath } from "@/config/app-config";
import { getMerchantStores, updateMerchantStore } from "../stores-api";
import { Store } from "../types";
import { buildStoreInput, StoreSettingsFields } from "./settings-fields";

export function StoreSettingsManager() {
  const [stores, setStores] = React.useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [origin, setOrigin] = React.useState("");

  React.useEffect(() => setOrigin(window.location.origin), []);

  React.useEffect(() => {
    const controller = new AbortController();

    getMerchantStores({ signal: controller.signal })
      .then((data) => {
        setStores(data);
        setSelectedStoreId(data[0]?.id ?? "");
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== "AbortError") {
          setMessage(error.message);
        }
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, []);

  const selectedStore = stores.find((store) => store.id === selectedStoreId);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading stores…</p>;
  }

  if (!selectedStore) {
    return (
      <section className="rounded-xl border bg-card p-10 text-center shadow-sm">
        <StoreIcon className="mx-auto size-9 text-muted-foreground" />
        <h2 className="mt-3 font-semibold">No store assigned</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ask the platform administrator to create your first store.
        </p>
      </section>
    );
  }

  const publicPath = getPublicStorePath(
    selectedStore.merchant.slug,
    selectedStore.slug,
  );
  const publicUrl = `${origin}${publicPath}`;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedStore) return;

    const form = new FormData(event.currentTarget);
    setIsSaving(true);
    setMessage("");

    try {
      const updatedStore = await updateMerchantStore(
        selectedStore.id,
        buildStoreInput(form),
      );
      setStores((current) =>
        current.map((store) =>
          store.id === updatedStore.id ? updatedStore : store,
        ),
      );
      setMessage("Store settings saved");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to save store",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function copyStoreLink() {
    await navigator.clipboard.writeText(publicUrl);
    setMessage("Customer link copied");
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border bg-zinc-950 text-white shadow-sm">
        <div className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center md:p-8">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm text-white/60">
              <Globe2Icon className="size-4" /> Storefront control center
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">
              {selectedStore.name}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
              Keep your public store information, branding, links, pricing, and
              publishing status in one place.
            </p>
          </div>
          <div className="flex gap-6 rounded-xl border border-white/10 bg-white/5 px-5 py-4">
            <div>
              <p className="text-2xl font-semibold">
                {selectedStore._count.products}
              </p>
              <p className="text-xs text-white/50">Products</p>
            </div>
            <div className="w-px bg-white/10" />
            <div>
              <p className="flex items-center gap-2 text-sm font-medium">
                <span
                  className={`size-2 rounded-full ${selectedStore.isPublished ? "bg-emerald-400" : "bg-amber-400"}`}
                />
                {selectedStore.isPublished ? "Live" : "Draft"}
              </p>
              <p className="mt-1 text-xs text-white/50">Store status</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[17rem_1fr]">
        <aside className="h-fit rounded-xl border bg-card p-3 shadow-sm">
          <p className="px-2 pb-2 text-xs font-medium uppercase text-muted-foreground">
            Your stores
          </p>
          {stores.map((store) => (
            <button
              key={store.id}
              type="button"
              onClick={() => setSelectedStoreId(store.id)}
              className={`flex w-full items-center gap-3 rounded-lg p-3 text-left text-sm ${
                store.id === selectedStore.id ? "bg-muted" : "hover:bg-muted/50"
              }`}
            >
              <StoreIcon className="size-4" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{store.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {store.isPublished ? "Published" : "Draft"}
                </span>
              </span>
            </button>
          ))}
        </aside>

        <div className="space-y-6">
          <section className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="flex items-center gap-2 font-semibold">
                  <PackageOpenIcon className="size-4" /> Customer store link
                </h2>
                <p className="mt-1 break-all text-sm text-muted-foreground">
                  {publicUrl}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" type="button" onClick={copyStoreLink}>
                  <CopyIcon /> Copy link
                </Button>
                <Button
                  variant="outline"
                  nativeButton={false}
                  render={<Link href={publicPath} target="_blank" />}
                >
                  <ExternalLinkIcon /> View store
                </Button>
              </div>
            </div>
          </section>

          <form
            key={`${selectedStore.id}-${selectedStore.updatedAt}`}
            className="space-y-6"
            onSubmit={handleSubmit}
          >
            <StoreSettingsFields store={selectedStore} />

            <div className="flex items-center justify-end gap-3">
              {message ? (
                <p className="flex items-center gap-1 text-sm text-muted-foreground">
                  <CheckIcon className="size-4" /> {message}
                </p>
              ) : null}
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving…" : "Save store settings"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
