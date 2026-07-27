import "server-only";
import { getPlatformServiceCredentials } from "@/features/admin-support/server/settings";

type TelegramOrder = {
  id: string;
  currency: string;
  subtotal: { toString(): string };
  note: string | null;
  table: { number: number } | null;
  items: Array<{ productName: string; quantity: number }>;
};

export async function sendTelegramOrderAlert(
  store: {
    name: string;
    allowTelegramAlerts: boolean;
    telegramAlertsEnabled: boolean;
    telegramChatId: string | null;
  },
  order: TelegramOrder,
) {
  const { telegramBotToken: botToken } = await getPlatformServiceCredentials();
  if (
    !botToken ||
    !store.allowTelegramAlerts ||
    !store.telegramAlertsEnabled ||
    !store.telegramChatId
  ) {
    return;
  }

  const location = order.table ? `Table ${order.table.number}` : "Shared QR";
  const text = [
    "🔔 New order",
    `Store: ${store.name}`,
    `Order: #${order.id.slice(-8).toUpperCase()}`,
    `Source: ${location}`,
    "",
    ...order.items.map((item) => `• ${item.quantity} × ${item.productName}`),
    "",
    `Total: ${order.subtotal.toString()} ${order.currency}`,
    ...(order.note ? [`Note: ${order.note}`] : []),
  ].join("\n");

  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: store.telegramChatId, text }),
      signal: AbortSignal.timeout(5_000),
    },
  );
  if (!response.ok) {
    console.error("Telegram order alert failed", response.status);
  }
}
