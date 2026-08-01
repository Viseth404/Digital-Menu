import "server-only";

import { getPlatformServiceCredentials } from "@/features/admin-support/server/settings";

type ClosedReport = {
  from: string;
  to: string;
  orderCount: number;
  completedCount: number;
  cancelledCount: number;
  total: string;
  currency: string;
};

export async function sendTelegramReportClosedAlert(
  store: {
    name: string;
    allowTelegramAlerts: boolean;
    telegramAlertsEnabled: boolean;
    telegramChatId: string | null;
  },
  report: ClosedReport,
  closedBy: string,
  reportUrl: string,
) {
  const { telegramBotToken: botToken } = await getPlatformServiceCredentials();
  if (
    !botToken ||
    !store.allowTelegramAlerts ||
    !store.telegramAlertsEnabled ||
    !store.telegramChatId
  ) {
    return false;
  }

  const text = [
    "📊 បានបិទរបាយការណ៍លក់",
    "",
    "🏪 ហាង",
    store.name,
    "",
    "📅 កាលបរិច្ឆេទ",
    report.from === report.to ? report.from : `${report.from} ដល់ ${report.to}`,
    "",
    "━━━━━━━━━━━━━━━━━━",
    "",
    `🧾 ការកុម្ម៉ង់សរុប៖ ${report.orderCount}`,
    `✅ បានបញ្ចប់៖ ${report.completedCount}`,
    `❌ បានបោះបង់៖ ${report.cancelledCount}`,
    "",
    "🤑 ទឹកប្រាក់សរុប",
    formatMoney(report.total, report.currency),
    "",
    `👤 បិទដោយ៖ ${closedBy}`,
    "",
    "━━━━━━━━━━━━━━━━━━",
    "",
    `🔗 មើលរបាយការណ៍ (${reportUrl})`,
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
    console.error("Telegram closed-report alert failed", response.status);
  }
  return response.ok;
}

function formatMoney(value: string, currency: string) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    minimumFractionDigits: currency === "KHR" ? 0 : 2,
    maximumFractionDigits: currency === "KHR" ? 0 : 2,
  }).format(Number(value));
}
