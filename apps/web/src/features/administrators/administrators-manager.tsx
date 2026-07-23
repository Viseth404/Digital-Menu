"use client";

import * as React from "react";
import {
  FileSpreadsheetIcon,
  ShieldCheckIcon,
  UserPlusIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/api-client";
import { exportExcelWorkbook } from "@/lib/excel-export";

type Administrator = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
};

export function AdministratorsManager() {
  const [administrators, setAdministrators] = React.useState<Administrator[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState("");

  React.useEffect(() => {
    const controller = new AbortController();
    apiRequest<Administrator[]>("/admin/administrators", {
      signal: controller.signal,
    })
      .then(setAdministrators)
      .catch((error: Error) => setMessage(error.message))
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setSaving(true);
    setMessage("");
    try {
      const administrator = await apiRequest<Administrator>(
        "/admin/administrators",
        {
          method: "POST",
          body: JSON.stringify({
            name: String(data.get("name")),
            email: String(data.get("email")),
            password: String(data.get("password")),
          }),
        },
      );
      setAdministrators((current) => [...current, administrator]);
      form.reset();
      setMessage("Administrator created successfully");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to create administrator",
      );
    } finally {
      setSaving(false);
    }
  }

  async function exportAdministrators() {
    await exportExcelWorkbook(
      `platform-administrators-${new Date().toISOString().slice(0, 10)}.xlsx`,
      [{
        name: "Administrators",
        headers: ["Name", "Email", "Status", "Created"],
        rows: administrators.map((administrator) => [
          administrator.name,
          administrator.email,
          administrator.isActive ? "Active" : "Disabled",
          new Date(administrator.createdAt),
        ]),
        dateColumns: [3],
      }],
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[22rem_1fr]">
      <section className="h-fit rounded-2xl border bg-card p-5 shadow-sm">
        <div className="mb-5 flex gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <UserPlusIcon className="size-5" />
          </span>
          <div>
            <h2 className="font-semibold">Create administrator</h2>
            <p className="text-sm text-muted-foreground">
              Grants full platform access equivalent to admin@savor.com.
            </p>
          </div>
        </div>
        <form className="space-y-4" onSubmit={submit}>
          <Field name="name" label="Full name" type="text" />
          <Field name="email" label="Email" type="email" />
          <Field name="password" label="Temporary password" type="password" />
          {message ? <p className="text-sm" role="status">{message}</p> : null}
          <Button className="w-full" disabled={saving}>
            {saving ? "Creating…" : "Create administrator"}
          </Button>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="flex items-start justify-between gap-4 border-b p-5">
          <div>
            <h2 className="flex items-center gap-2 font-semibold">
              <ShieldCheckIcon className="size-4" /> Platform administrators
            </h2>
            <p className="text-sm text-muted-foreground">
              These accounts can control every merchant and platform setting.
            </p>
          </div>
          <Button
            variant="outline"
            disabled={!administrators.length}
            onClick={() => void exportAdministrators()}
          >
            <FileSpreadsheetIcon /> Export Excel
          </Button>
        </div>
        {loading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading…</p>
        ) : (
          <div className="divide-y">
            {administrators.map((administrator) => (
              <div key={administrator.id} className="flex items-center gap-4 p-5">
                <span className="grid size-10 place-items-center rounded-full bg-muted font-semibold">
                  {administrator.name.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{administrator.name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {administrator.email}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700">
                  {administrator.isActive ? "Active" : "Disabled"}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Field({
  name,
  label,
  type,
}: {
  name: string;
  label: string;
  type: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      {label}
      <Input
        name={name}
        type={type}
        minLength={type === "password" ? 8 : 2}
        required
      />
    </label>
  );
}
