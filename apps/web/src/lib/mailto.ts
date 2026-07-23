import { appConfig } from "@/config/app-config";

export function createSupportMailto(subject: string): string {
  return `mailto:${appConfig.supportEmail}?subject=${encodeURIComponent(subject)}`;
}
