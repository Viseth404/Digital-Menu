"use client";

import * as React from "react";
import { CheckIcon, PaletteIcon, RotateCcwIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createStorefrontStyle } from "@/features/storefront/utils";
import {
  PROMOTION_RULES,
  STORE_COLOR_PRESETS,
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

export function StoreSettingsFields({ store }: { store: Store }) {
  return (
    <>
      <SettingsSection title="Storefront branding">
        <FormInput
          label="Khmer store name"
          name="nameKh"
          lang="km"
          defaultValue={store.nameKh ?? ""}
          placeholder="ឈ្មោះហាងជាភាសាខ្មែរ"
          required={false}
        />
        <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">
          Description
          <textarea
            name="description"
            defaultValue={store.description ?? ""}
            rows={4}
            className="rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">
          Khmer description
          <textarea
            name="descriptionKh"
            lang="km"
            defaultValue={store.descriptionKh ?? ""}
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
          <StoreColorEditor
            primaryColor={store.primaryColor}
            accentColor={store.accentColor}
          />
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
    nameKh: nullable("nameKh"),
    description: nullable("description"),
    descriptionKh: nullable("descriptionKh"),
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

function StoreColorEditor({
  primaryColor: initialPrimary,
  accentColor: initialAccent,
}: {
  primaryColor: string;
  accentColor: string;
}) {
  const [primaryColor, setPrimaryColor] = React.useState(initialPrimary);
  const [accentColor, setAccentColor] = React.useState(initialAccent);
  const isHexColor = (value: string) =>
    new RegExp(STORE_THEME.hexColorPattern, "i").test(value);
  const previewPrimary = isHexColor(primaryColor)
    ? primaryColor
    : STORE_THEME.defaultPrimaryColor;
  const previewAccent = isHexColor(accentColor)
    ? accentColor
    : STORE_THEME.defaultAccentColor;
  const previewStyle = createStorefrontStyle(previewPrimary, previewAccent);
  const activePreset = STORE_COLOR_PRESETS.find(
    (preset) =>
      preset.primary === primaryColor && preset.accent === accentColor,
  );

  function normalizeColor(
    value: string,
    update: React.Dispatch<React.SetStateAction<string>>,
  ) {
    update(value.toUpperCase());
  }

  return (
    <section className="overflow-hidden rounded-2xl border bg-muted/20">
      <header className="flex flex-col gap-3 border-b bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-foreground text-background">
            <PaletteIcon className="size-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold">Store colors</h3>
            <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
              Control buttons, prices, active categories, and highlights.
            </p>
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => {
            setPrimaryColor(STORE_THEME.defaultPrimaryColor);
            setAccentColor(STORE_THEME.defaultAccentColor);
          }}
        >
          <RotateCcwIcon /> Reset
        </Button>
      </header>

      <div className="grid gap-5 p-4 lg:grid-cols-[1fr_15rem]">
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Ready-made themes
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {STORE_COLOR_PRESETS.map((preset) => {
                const selected = activePreset?.name === preset.name;
                return (
                  <button
                    key={preset.name}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      setPrimaryColor(preset.primary);
                      setAccentColor(preset.accent);
                    }}
                    className={`flex items-center gap-3 rounded-xl border bg-background p-2.5 text-left transition hover:border-foreground/30 focus-visible:outline-2 focus-visible:outline-offset-2 ${
                      selected ? "border-foreground ring-1 ring-foreground" : ""
                    }`}
                  >
                    <span className="flex -space-x-2">
                      <span
                        className="size-8 rounded-full border-2 border-background shadow-sm"
                        style={{ backgroundColor: preset.primary }}
                      />
                      <span
                        className="size-8 rounded-full border-2 border-background shadow-sm"
                        style={{ backgroundColor: preset.accent }}
                      />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-xs font-semibold">
                      {preset.name}
                    </span>
                    {selected ? <CheckIcon className="size-4" /> : null}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <ColorControl
              label="Brand color"
              name="primaryColor"
              value={primaryColor}
              description="Buttons, prices, and selected categories"
              onChange={(value) => normalizeColor(value, setPrimaryColor)}
            />
            <ColorControl
              label="Accent color"
              name="accentColor"
              value={accentColor}
              description="Soft backgrounds and highlighted areas"
              onChange={(value) => normalizeColor(value, setAccentColor)}
            />
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Live preview
          </p>
          <div
            style={previewStyle}
            className="overflow-hidden rounded-2xl border bg-white shadow-sm"
          >
            <div
              className="h-16"
              style={{
                background: `linear-gradient(135deg, ${previewPrimary}, ${previewPrimary}CC)`,
              }}
            />
            <div className="space-y-3 p-3">
              <div className="flex gap-2">
                <span className="rounded-full bg-[var(--store-primary)] px-3 py-1.5 text-[10px] font-bold text-[var(--store-on-primary)]">
                  All menu
                </span>
                <span className="rounded-full border px-3 py-1.5 text-[10px] font-semibold">
                  Popular
                </span>
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-xs font-semibold">Signature dish</p>
                <p className="mt-1 text-sm font-bold text-[var(--store-primary)]">
                  $8.50
                </p>
              </div>
              <button
                type="button"
                tabIndex={-1}
                className="h-9 w-full rounded-xl bg-[var(--store-primary)] text-xs font-bold text-[var(--store-on-primary)]"
              >
                Add to order
              </button>
              <div
                className="rounded-lg p-2 text-center text-[10px] font-medium"
                style={{ backgroundColor: previewAccent }}
              >
                Accent highlight
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ColorControl({
  label,
  name,
  value,
  description,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  description: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1.5 rounded-xl border bg-background p-3 text-sm font-medium">
      {label}
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={
            new RegExp(STORE_THEME.hexColorPattern, "i").test(value)
              ? value
              : STORE_THEME.defaultPrimaryColor
          }
          onChange={(event) => onChange(event.target.value)}
          aria-label={`${label} picker`}
          className="h-10 w-12 cursor-pointer rounded-md border bg-transparent p-1"
        />
        <Input
          name={name}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          pattern={STORE_THEME.hexColorPattern}
          maxLength={7}
          className="font-mono uppercase"
          required
        />
      </div>
      <span className="font-normal leading-5 text-muted-foreground">
        {description}
      </span>
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
