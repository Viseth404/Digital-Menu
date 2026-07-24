import type { CSSProperties } from "react";
import type { StorefrontCategory } from "./types";

export const ALL_CATEGORIES = "all";

export type StorefrontStyle = CSSProperties & {
  "--store-primary": string;
  "--store-accent": string;
  "--store-on-primary": string;
};

export function createStorefrontStyle(
  primaryColor: string,
  accentColor: string,
): StorefrontStyle {
  const safePrimary = normalizeThemeColor(primaryColor, "#155D32");
  const safeAccent = normalizeThemeColor(accentColor, "#F8F3E8");
  return {
    "--store-primary": safePrimary,
    "--store-accent": safeAccent,
    "--store-on-primary": getContrastColor(safePrimary),
  };
}

function normalizeThemeColor(value: string, fallback: string) {
  return /^#[0-9A-F]{6}$/i.test(value) ? value.toUpperCase() : fallback;
}

export function filterStorefrontCategories(
  categories: StorefrontCategory[],
  activeCategory: string,
  search: string,
) {
  const query = search.trim().toLowerCase();

  return categories
    .filter(
      (category) =>
        activeCategory === ALL_CATEGORIES || category.id === activeCategory,
    )
    .map((category) => ({
      ...category,
      products: category.products.filter(
        (product) =>
          !query ||
          product.name.toLowerCase().includes(query) ||
          product.description?.toLowerCase().includes(query) ||
          category.name.toLowerCase().includes(query),
      ),
    }))
    .filter((category) => category.products.length > 0);
}

export function countProducts(categories: StorefrontCategory[]) {
  return categories.reduce(
    (total, category) => total + category.products.length,
    0,
  );
}

function getContrastColor(hex: string) {
  const value = hex.replace("#", "");
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  const luminance = (red * 299 + green * 587 + blue * 114) / 1000;
  return luminance > 155 ? "#18181B" : "#FFFFFF";
}
