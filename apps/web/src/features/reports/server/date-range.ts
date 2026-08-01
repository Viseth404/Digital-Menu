import "server-only";

import { ApiException } from "@/lib/server/api-response";

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MAX_REPORT_DAYS = 366;

export function getTodayDateString(timeZone: string, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return `${value.year}-${value.month}-${value.day}`;
}

export function getReportDateRange(
  fromValue: string | null,
  toValue: string | null,
  timeZone: string,
) {
  const today = getTodayDateString(timeZone);
  const from = fromValue ?? today;
  const to = toValue ?? from;
  const fromParts = parseDate(from, "from");
  const toParts = parseDate(to, "to");
  const fromDay = Date.UTC(fromParts.year, fromParts.month - 1, fromParts.day);
  const toDay = Date.UTC(toParts.year, toParts.month - 1, toParts.day);

  if (toDay < fromDay) {
    throw new ApiException(
      "The end date must be on or after the start date",
      400,
    );
  }
  const dayCount = Math.floor((toDay - fromDay) / 86_400_000) + 1;
  if (dayCount > MAX_REPORT_DAYS) {
    throw new ApiException(
      `Reports are limited to ${MAX_REPORT_DAYS} days`,
      400,
    );
  }
  if (to > today) {
    throw new ApiException("Reports cannot include future dates", 400);
  }

  const nextDay = new Date(toDay + 86_400_000).toISOString().slice(0, 10);
  return {
    from,
    to,
    start: localMidnightToUtc(from, timeZone),
    end: localMidnightToUtc(nextDay, timeZone),
    dayCount,
  };
}

function parseDate(value: string, field: string) {
  const match = DATE_PATTERN.exec(value);
  if (!match) throw new ApiException(`${field} must use YYYY-MM-DD`, 400);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new ApiException(`${field} is not a valid date`, 400);
  }
  return { year, month, day };
}

function localMidnightToUtc(value: string, timeZone: string) {
  const { year, month, day } = parseDate(value, "date");
  const target = Date.UTC(year, month - 1, day);
  let result = new Date(target);

  // Recalculate once so daylight-saving transitions also resolve correctly.
  for (let index = 0; index < 2; index += 1) {
    result = new Date(target - getTimeZoneOffset(result, timeZone));
  }
  return result;
}

function getTimeZoneOffset(value: Date, timeZone: string) {
  try {
    const parts = new Intl.DateTimeFormat("en", {
      timeZone,
      timeZoneName: "longOffset",
    }).formatToParts(value);
    const name = parts.find((part) => part.type === "timeZoneName")?.value;
    if (name === "GMT" || name === "UTC") return 0;
    const match = /^GMT([+-])(\d{2}):(\d{2})$/.exec(name ?? "");
    if (!match) throw new Error("Unsupported time-zone offset");
    const sign = match[1] === "+" ? 1 : -1;
    return sign * (Number(match[2]) * 60 + Number(match[3])) * 60_000;
  } catch {
    throw new ApiException("The store time zone is invalid", 400);
  }
}
