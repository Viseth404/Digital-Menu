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

export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
