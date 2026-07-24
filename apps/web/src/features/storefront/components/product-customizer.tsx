"use client";

import * as React from "react";
import { PlusIcon, XIcon } from "lucide-react";
import { formatStorePrice } from "@/features/stores/format";
import type { StorefrontProduct } from "@/features/storefront/types";

export type SelectedProductOption = {
  id: string;
  groupName: string;
  name: string;
  priceDelta: number;
};

export function ProductCustomizer({
  product,
  currency,
  exchangeRate,
  onClose,
  onAdd,
}: {
  product: StorefrontProduct;
  currency: string;
  exchangeRate: number;
  onClose: () => void;
  onAdd: (options: SelectedProductOption[]) => void;
}) {
  const [selected, setSelected] = React.useState<Record<string, string[]>>({});
  const [error, setError] = React.useState("");
  const choices = product.optionGroups.flatMap((group) =>
    (selected[group.id] ?? []).flatMap((optionId) => {
      const option = group.options.find((item) => item.id === optionId);
      return option
        ? [
            {
              id: option.id,
              groupName: group.name,
              name: option.name,
              priceDelta: Number(option.priceDelta),
            },
          ]
        : [];
    }),
  );
  const total =
    Number(product.price) +
    choices.reduce((sum, option) => sum + option.priceDelta, 0);

  function submit() {
    for (const group of product.optionGroups) {
      if ((selected[group.id]?.length ?? 0) < group.minSelections) {
        setError(`Choose at least ${group.minSelections} from ${group.name}.`);
        return;
      }
    }
    onAdd(choices);
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/55 backdrop-blur-sm sm:items-center sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="customizer-title"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-[2rem] border border-[#D4AF37]/35 bg-[#FFFDF8] p-5 text-[#1B1B1B] shadow-2xl sm:rounded-[2rem] sm:p-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2E7D32]">
              Customize your dish
            </p>
            <h2 id="customizer-title" className="mt-1 text-2xl font-bold">
              {product.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close customization"
            className="grid size-10 place-items-center rounded-full border text-[#7A6A52] hover:bg-[#F8F3E8]"
          >
            <XIcon className="size-4" />
          </button>
        </header>

        <div className="mt-6 space-y-5">
          {product.optionGroups.map((group) => {
            const groupSelected = selected[group.id] ?? [];
            const multiple = group.maxSelections > 1;
            return (
              <fieldset key={group.id}>
                <legend className="flex w-full items-center justify-between gap-3 font-bold">
                  <span>{group.name}</span>
                  <span className="rounded-full bg-[#F8F3E8] px-2.5 py-1 text-[0.68rem] font-semibold text-[#7A6A52]">
                    {group.required ? "Required" : "Optional"} · up to{" "}
                    {group.maxSelections}
                  </span>
                </legend>
                <div className="mt-2 grid gap-2">
                  {group.options.map((option) => {
                    const checked = groupSelected.includes(option.id);
                    return (
                      <label
                        key={option.id}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                          checked
                            ? "border-[#2E7D32] bg-[#2E7D32]/8"
                            : "border-[#7A6A52]/20 hover:border-[#D4AF37]"
                        }`}
                      >
                        <input
                          type={multiple ? "checkbox" : "radio"}
                          name={group.id}
                          checked={checked}
                          onChange={() => {
                            setError("");
                            setSelected((current) => {
                              const values = current[group.id] ?? [];
                              const next = multiple
                                ? checked
                                  ? values.filter((id) => id !== option.id)
                                  : values.length < group.maxSelections
                                    ? [...values, option.id]
                                    : values
                                : [option.id];
                              return { ...current, [group.id]: next };
                            });
                          }}
                          className="size-4 accent-[#155D32]"
                        />
                        <span className="flex-1 text-sm font-semibold">
                          {option.name}
                        </span>
                        {Number(option.priceDelta) ? (
                          <span className="text-sm font-bold text-[#155D32]">
                            +
                            {formatStorePrice(
                              option.priceDelta,
                              currency,
                              exchangeRate,
                            )}
                          </span>
                        ) : (
                          <span className="text-xs text-[#7A6A52]">
                            Included
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}
        </div>

        {error ? (
          <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          onClick={submit}
          className="mt-6 flex h-13 w-full items-center justify-center gap-2 rounded-xl border border-[#D4AF37]/70 bg-[#155D32] px-5 font-bold text-white shadow-lg transition hover:bg-[#2E7D32] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4AF37]"
        >
          <PlusIcon className="size-5" />
          Add to order · {formatStorePrice(total, currency, exchangeRate)}
        </button>
      </div>
    </div>
  );
}
