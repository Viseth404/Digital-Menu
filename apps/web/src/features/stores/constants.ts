export const STORE_CURRENCIES = [
  { value: "USD", label: "USD — US Dollar" },
  { value: "KHR", label: "KHR — Cambodian Riel" },
] as const;

export const STORE_SOCIALS = [
  { key: "facebookUrl", label: "Facebook" },
  { key: "instagramUrl", label: "Instagram" },
  { key: "telegramUrl", label: "Telegram" },
  { key: "tiktokUrl", label: "TikTok" },
] as const;

export const STORE_THEME = {
  defaultPrimaryColor: "#166534",
  defaultAccentColor: "#F0FDF4",
  hexColorPattern: "^#[0-9A-Fa-f]{6}$",
} as const;

export const STORE_COLOR_PRESETS = [
  { name: "Palm & Sand", primary: "#155D32", accent: "#F8F3E8" },
  { name: "Angkor Gold", primary: "#8A5A12", accent: "#FFF7E1" },
  { name: "Lotus Rose", primary: "#9D3E5B", accent: "#FFF0F4" },
  { name: "Mekong Blue", primary: "#155E75", accent: "#ECFEFF" },
  { name: "Charcoal", primary: "#27272A", accent: "#F4F4F5" },
] as const;

export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

export const PROMOTION_RULES = {
  titleMaxLength: 80,
  messageMaxLength: 240,
  displayDelayMs: 700,
  sessionStoragePrefix: "teamone-menu-promotion",
} as const;
