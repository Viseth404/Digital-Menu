"use client";

import * as React from "react";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  DatabaseIcon,
  HardDriveIcon,
  RefreshCwIcon,
  SettingsIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSystemHealth, updatePlatformSettings } from "../platform-api";
import type { SystemHealth } from "../platform-types";

export function SystemConsole() {
  const [health, setHealth] = React.useState<SystemHealth | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      setHealth(await getSystemHealth());
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to check system",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!health) return;
    const form = new FormData(event.currentTarget);
    const settings = {
      maintenanceMode: form.get("maintenanceMode") === "on",
      announcement: String(form.get("announcement") || "") || null,
      supportEmail: String(form.get("supportEmail")),
      defaultCurrency: String(form.get("defaultCurrency")),
      uploadLimitMb: Number(form.get("uploadLimitMb")),
      sessionDurationDays: Number(form.get("sessionDurationDays")),
    };
    setSaving(true);
    try {
      const updated = await updatePlatformSettings(settings);
      setHealth({ ...health, settings: updated });
      setMessage("Platform settings saved and audited");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to save settings",
      );
    } finally {
      setSaving(false);
    }
  }

  if (!health) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        {message || "Checking platform health…"}
      </p>
    );
  }

  const checks = [
    {
      label: "Database",
      value: health.database.connected
        ? `Connected · ${health.database.latencyMs} ms`
        : "Unavailable",
      good: health.database.connected && health.database.schemaReady,
      icon: DatabaseIcon,
    },
    {
      label: "Upload storage",
      value: `${health.storage.uploadFiles} files · ${formatBytes(health.storage.uploadBytes)}`,
      good:
        !health.storage.orphanedFiles.length &&
        !health.storage.missingFiles.length,
      icon: HardDriveIcon,
    },
    {
      label: "Backup monitoring",
      value: health.backup.message,
      good: health.backup.configured,
      icon: RefreshCwIcon,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-zinc-950 p-6 text-white md:p-8">
        <p className="flex items-center gap-2 text-sm text-white/60">
          <SettingsIcon className="size-4" /> Platform maintenance
        </p>
        <div className="mt-2 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold">System health</h2>
            <p className="mt-2 text-sm text-white/60">
              Version {health.version} · Checked{" "}
              {new Date(health.checkedAt).toLocaleString()}
            </p>
          </div>
          <Button
            className="bg-white text-zinc-950 hover:bg-white/90"
            onClick={() => void load()}
            disabled={loading}
          >
            <RefreshCwIcon /> Recheck
          </Button>
        </div>
      </section>

      {message ? (
        <p className="rounded-xl border bg-card p-3 text-sm">{message}</p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        {checks.map(({ label, value, good, icon: Icon }) => (
          <article
            key={label}
            className="rounded-2xl border bg-card p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <Icon className="size-5" />
              {good ? (
                <CheckCircle2Icon className="size-5 text-emerald-500" />
              ) : (
                <AlertTriangleIcon className="size-5 text-amber-500" />
              )}
            </div>
            <h3 className="mt-4 font-semibold">{label}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{value}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <section className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
          <h3 className="font-semibold">Data diagnostics</h3>
          <div className="mt-4 space-y-3">
            <Diagnostic
              label="Merchants without active owners"
              value={health.data.merchantsWithoutOwners}
            />
            <Diagnostic
              label="Stores without products"
              value={health.data.storesWithoutProducts}
            />
            <Diagnostic
              label="Stores without table QR codes"
              value={health.data.storesWithoutTables}
            />
            <Diagnostic
              label="Active orders older than 24 hours"
              value={health.data.staleActiveOrders}
            />
            <Diagnostic
              label="Orphaned upload files"
              value={health.storage.orphanedFiles.length}
              details={health.storage.orphanedFiles}
            />
            <Diagnostic
              label="Missing referenced images"
              value={health.storage.missingFiles.length}
              details={health.storage.missingFiles}
            />
          </div>
        </section>

        <form
          key={health.settings.updatedAt}
          onSubmit={save}
          className="rounded-2xl border bg-card p-5 shadow-sm md:p-6"
        >
          <h3 className="font-semibold">Platform settings</h3>
          <p className="text-sm text-muted-foreground">
            Operational defaults and customer maintenance controls
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Support email">
              <Input
                name="supportEmail"
                type="email"
                defaultValue={health.settings.supportEmail}
                required
              />
            </Field>
            <Field label="Default currency">
              <Input
                name="defaultCurrency"
                defaultValue={health.settings.defaultCurrency}
                maxLength={3}
                required
              />
            </Field>
            <Field label="Upload limit (MB)">
              <Input
                name="uploadLimitMb"
                type="number"
                min="1"
                max="100"
                defaultValue={health.settings.uploadLimitMb}
                required
              />
            </Field>
            <Field label="Session duration (days)">
              <Input
                name="sessionDurationDays"
                type="number"
                min="1"
                max="90"
                defaultValue={health.settings.sessionDurationDays}
                required
              />
            </Field>
            <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">
              Platform announcement
              <textarea
                name="announcement"
                rows={3}
                maxLength={500}
                defaultValue={health.settings.announcement ?? ""}
                className="rounded-lg border bg-transparent p-3 text-sm"
              />
            </label>
            <label className="flex items-center gap-3 rounded-xl border p-4 sm:col-span-2">
              <input
                name="maintenanceMode"
                type="checkbox"
                defaultChecked={health.settings.maintenanceMode}
                className="size-4"
              />
              <span>
                <span className="block text-sm font-medium">
                  Customer maintenance mode
                </span>
                <span className="text-xs text-muted-foreground">
                  Temporarily blocks public storefronts while administrators and
                  merchants retain access.
                </span>
              </span>
            </label>
          </div>
          <Button className="mt-5" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save platform settings"}
          </Button>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      {label}
      {children}
    </label>
  );
}

function Diagnostic({
  label,
  value,
  details,
}: {
  label: string;
  value: number;
  details?: string[];
}) {
  return (
    <div className="rounded-xl bg-muted/60 p-3">
      <div className="flex justify-between gap-3 text-sm">
        <span>{label}</span>
        <span
          className={
            value ? "font-semibold text-amber-700" : "text-emerald-700"
          }
        >
          {value}
        </span>
      </div>
      {details?.length ? (
        <p className="mt-1 break-all text-xs text-muted-foreground">
          {details.join(", ")}
        </p>
      ) : null}
    </div>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
