"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import {
  PROMOTION_RULES,
  STORE_CURRENCIES,
  STORE_SOCIALS,
  STORE_THEME,
} from "../constants";
import type { Store, UpdateStoreInput } from "../types";
import { ImageUploadField } from "./image-upload-field";

const BRAND_IMAGES = [
  {
    label: "Store logo",
    name: "logoUrl",
    description: "Use a square JPG, PNG, WebP, or GIF up to 5 MB.",
    aspect: "square",
  },
  {
    label: "Cover image",
    name: "coverImageUrl",
    description: "Use a wide JPG, PNG, WebP, or GIF up to 5 MB.",
    aspect: "cover",
  },
] as const;

const BRAND_COLORS = [
  {
    label: "Brand color",
    name: "primaryColor",
    description: "Buttons, prices, and active categories",
  },
  {
    label: "Accent color",
    name: "accentColor",
    description: "Highlights and soft backgrounds",
  },
] as const;

export function StoreSettingsFields({ store }: { store: Store }) {
  return (
    <>
      <SettingsSection title="Storefront branding">
        <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">
          Description
          <textarea
            name="description"
            defaultValue={store.description ?? ""}
            rows={4}
            className="rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        <FormInput
          label="Address"
          name="address"
          defaultValue={store.address ?? ""}
          required={false}
        />
        {BRAND_IMAGES.map((field) => (
          <ImageUploadField
            key={field.name}
            {...field}
            defaultValue={store[field.name]}
          />
        ))}
        <div className="sm:col-span-2">
          <p className="mb-3 text-sm font-medium">Store colors</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {BRAND_COLORS.map((field) => (
              <ColorInput
                key={field.name}
                {...field}
                defaultValue={store[field.name]}
              />
            ))}
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Menu promotion popup">
        <div className="sm:col-span-2">
          <p className="text-sm text-muted-foreground">
            Show customers a promotion shortly after they open your public menu.
            It appears once per browser session.
          </p>
        </div>
        <FormInput
          label="Promotion headline"
          name="promotionTitle"
          defaultValue={store.promotionTitle ?? ""}
          placeholder="Weekend special — 20% off"
          maxLength={PROMOTION_RULES.titleMaxLength}
          required={false}
        />
        <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">
          Promotion message
          <textarea
            name="promotionMessage"
            defaultValue={store.promotionMessage ?? ""}
            rows={3}
            maxLength={PROMOTION_RULES.messageMaxLength}
            placeholder="Enjoy 20% off selected dishes this weekend."
            className="rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        <ImageUploadField
          label="Promotion image"
          name="promotionImageUrl"
          description="Optional wide JPG, PNG, WebP, or GIF up to 5 MB."
          aspect="product"
          defaultValue={store.promotionImageUrl}
        />
        <label className="flex items-center gap-3 rounded-lg border p-3 text-sm sm:col-span-2">
          <input
            name="promotionEnabled"
            type="checkbox"
            defaultChecked={store.promotionEnabled}
            className="size-4"
          />
          <span>
            <span className="block font-medium">Enable promotion popup</span>
            <span className="text-muted-foreground">
              A headline and message are required when enabled.
            </span>
          </span>
        </label>
      </SettingsSection>

      <SettingsSection title="Social media">
        {STORE_SOCIALS.map(({ key, label }) => (
          <FormInput
            key={key}
            label={`${label} URL`}
            name={key}
            type="url"
            defaultValue={store[key] ?? ""}
            required={false}
          />
        ))}
      </SettingsSection>

      <SettingsSection title="Currency and publishing">
        <label className="grid gap-1.5 text-sm font-medium">
          Currency
          <select
            name="currency"
            defaultValue={store.currency}
            className="h-9 rounded-md border bg-transparent px-3 text-sm"
          >
            {STORE_CURRENCIES.map((currency) => (
              <option key={currency.value} value={currency.value}>
                {currency.label}
              </option>
            ))}
          </select>
        </label>
        <FormInput
          label="Exchange rate"
          name="exchangeRate"
          type="number"
          step="0.0001"
          min="0.0001"
          defaultValue={store.exchangeRate}
        />
        <label className="flex items-center gap-3 rounded-lg border p-3 text-sm sm:col-span-2">
          <input
            name="isPublished"
            type="checkbox"
            defaultChecked={store.isPublished}
            className="size-4"
          />
          <span>
            <span className="block font-medium">Publish customer store</span>
            <span className="text-muted-foreground">
              Customers can open the public link when enabled.
            </span>
          </span>
        </label>
      </SettingsSection>
    </>
  );
}

export function buildStoreInput(form: FormData): UpdateStoreInput {
  const nullable = (name: string) =>
    String(form.get(name) ?? "").trim() || null;

  return {
    description: nullable("description"),
    address: nullable("address"),
    logoUrl: nullable("logoUrl"),
    coverImageUrl: nullable("coverImageUrl"),
    promotionEnabled: form.get("promotionEnabled") === "on",
    promotionTitle: nullable("promotionTitle"),
    promotionMessage: nullable("promotionMessage"),
    promotionImageUrl: nullable("promotionImageUrl"),
    primaryColor: String(form.get("primaryColor")),
    accentColor: String(form.get("accentColor")),
    ...Object.fromEntries(STORE_SOCIALS.map(({ key }) => [key, nullable(key)])),
    currency: String(form.get("currency")),
    exchangeRate: Number(form.get("exchangeRate")),
    isPublished: form.get("isPublished") === "on",
  };
}

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm">
      <h2 className="mb-4 font-semibold">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function ColorInput({
  label,
  name,
  defaultValue,
  description,
}: {
  label: string;
  name: string;
  defaultValue: string;
  description: string;
}) {
  const [color, setColor] = React.useState(defaultValue);
  const updateColor = (event: React.ChangeEvent<HTMLInputElement>) =>
    setColor(event.target.value.toUpperCase());

  return (
    <label className="grid gap-1.5 rounded-xl border p-3 text-sm font-medium">
      {label}
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={color}
          onChange={updateColor}
          aria-label={`${label} picker`}
          className="h-10 w-12 cursor-pointer rounded-md border bg-transparent p-1"
        />
        <Input
          name={name}
          value={color}
          onChange={updateColor}
          pattern={STORE_THEME.hexColorPattern}
          maxLength={7}
          className="font-mono uppercase"
          required
        />
      </div>
      <span className="font-normal text-muted-foreground">{description}</span>
    </label>
  );
}

type FormInputProps = React.ComponentProps<typeof Input> & { label: string };

function FormInput({ label, ...props }: FormInputProps) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      {label}
      <Input required {...props} />
    </label>
  );
}
