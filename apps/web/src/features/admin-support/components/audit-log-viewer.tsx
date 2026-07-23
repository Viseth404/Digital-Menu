"use client";

import * as React from "react";
import { FileClockIcon, FileSpreadsheetIcon, SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { exportExcelWorkbook } from "@/lib/excel-export";
import { getAuditEntries } from "../platform-api";
import type { AuditEntry } from "../platform-types";

export function AuditLogViewer() {
  const [entries, setEntries] = React.useState<AuditEntry[]>([]);
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [message, setMessage] = React.useState("");

  React.useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      getAuditEntries(search, controller.signal)
        .then(setEntries)
        .catch((error: Error) => {
          if (error.name !== "AbortError") setMessage(error.message);
        })
        .finally(() => setLoading(false));
    }, 250);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [search]);

  async function exportExcel() {
    await exportExcelWorkbook(
      `admin-audit-${new Date().toISOString().slice(0, 10)}.xlsx`,
      [{
        name: "Administrator Audit",
        headers: [
          "Timestamp",
          "Administrator",
          "Email",
          "Action",
          "Target Type",
          "Target",
          "IP Address",
          "Details",
        ],
        rows: entries.map((entry) => [
          new Date(entry.createdAt),
          entry.admin.name,
          entry.admin.email,
          entry.action,
          entry.targetType,
          entry.targetName,
          entry.ipAddress,
          JSON.stringify(entry.details ?? {}),
        ]),
        dateColumns: [0],
      }],
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-zinc-950 p-6 text-white md:p-8">
        <p className="flex items-center gap-2 text-sm text-white/60">
          <FileClockIcon className="size-4" /> Security history
        </p>
        <h2 className="mt-2 text-3xl font-semibold">Administrator audit log</h2>
        <p className="mt-2 text-sm text-white/60">
          Sensitive support actions, actors, targets, changes, timestamps, and
          source addresses.
        </p>
      </section>
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <SearchIcon className="absolute left-3 top-3 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search administrator, action, or target…"
            className="pl-9"
          />
        </label>
        <Button
          variant="outline"
          onClick={() => void exportExcel()}
          disabled={!entries.length}
        >
          <FileSpreadsheetIcon /> Export Excel
        </Button>
      </div>
      {message ? <p className="text-sm text-destructive">{message}</p> : null}
      <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        {loading ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            Loading audit history…
          </p>
        ) : entries.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">Time</th>
                  <th className="px-5 py-3">Administrator</th>
                  <th className="px-5 py-3">Action</th>
                  <th className="px-5 py-3">Target</th>
                  <th className="px-5 py-3">Source</th>
                  <th className="px-5 py-3">Changes</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="whitespace-nowrap px-5 py-4 text-xs">
                      {new Date(entry.createdAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium">{entry.admin.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {entry.admin.email}
                      </p>
                    </td>
                    <td className="px-5 py-4 font-medium">
                      {formatLabel(entry.action)}
                    </td>
                    <td className="px-5 py-4">
                      <p>{entry.targetName ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">
                        {entry.targetType}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-xs">
                      {entry.ipAddress ?? "Local/unknown"}
                    </td>
                    <td className="max-w-80 px-5 py-4">
                      <code className="line-clamp-3 break-all text-xs text-muted-foreground">
                        {JSON.stringify(entry.details ?? {})}
                      </code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="p-12 text-center text-sm text-muted-foreground">
            No administrator actions recorded yet.
          </p>
        )}
      </section>
    </div>
  );
}

function formatLabel(value: string) {
  return value.toLowerCase().replaceAll("_", " ");
}
