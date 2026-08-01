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

export function formatStorage(bytes: number) {
  const megabytes = bytes / (1024 * 1024);
  return `${megabytes < 10 ? megabytes.toFixed(1) : Math.round(megabytes)} MB`;
}
