export function formatStorePrice(
  price: string | number,
  currency: string,
  exchangeRate: number,
) {
  const basePrice = Number(price);
  const value = currency === "USD" ? basePrice : basePrice * exchangeRate;
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "KHR" ? 0 : 2,
  }).format(value);
}
