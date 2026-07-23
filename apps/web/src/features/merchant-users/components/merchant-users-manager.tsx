"use client";

import * as React from "react";
import {
  FileSpreadsheetIcon,
  PlusIcon,
  StoreIcon,
  UserRoundIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { exportExcelWorkbook } from "@/lib/excel-export";
import { createMerchantUser, getMerchantUsers } from "../merchant-users-api";
import { MerchantUser } from "../types";

export function MerchantUsersManager() {
  const [users, setUsers] = React.useState<MerchantUser[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isCreating, setIsCreating] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");

  React.useEffect(() => {
    const controller = new AbortController();

    getMerchantUsers({ signal: controller.signal })
      .then(setUsers)
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== "AbortError") {
          setErrorMessage(error.message);
        }
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    setIsCreating(true);
    setErrorMessage("");

    try {
      const user = await createMerchantUser({
        ownerName: String(data.get("ownerName")),
        ownerEmail: String(data.get("ownerEmail")),
        ownerPhone: String(data.get("ownerPhone")) || undefined,
        password: String(data.get("password")),
        merchantName: String(data.get("merchantName")),
        merchantSlug: String(data.get("merchantSlug")),
      });

      setUsers((currentUsers) => [user, ...currentUsers]);
      form.reset();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to create merchant user",
      );
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[22rem_1fr]">
      <section className="h-fit rounded-xl border bg-card p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <PlusIcon className="size-5" />
          </div>
          <div>
            <h2 className="font-semibold">Create merchant user</h2>
            <p className="text-sm text-muted-foreground">
              Creates the owner, merchant, and first store.
            </p>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <FormInput
            label="Owner name"
            name="ownerName"
            placeholder="Dara Sok"
          />
          <FormInput
            label="Owner email"
            name="ownerEmail"
            type="email"
            placeholder="owner@restaurant.com"
          />
          <FormInput
            label="Contact phone (optional)"
            name="ownerPhone"
            type="tel"
            placeholder="+855 12 345 678"
            required={false}
          />
          <FormInput
            label="Temporary password"
            name="password"
            type="password"
            placeholder="Minimum 8 characters"
          />
          <FormInput
            label="Merchant name"
            name="merchantName"
            placeholder="Dara Restaurant Group"
          />
          <FormInput
            label="Merchant slug"
            name="merchantSlug"
            placeholder="dara-restaurant"
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          />
          {errorMessage ? (
            <p className="text-sm text-destructive" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <Button className="w-full" type="submit" disabled={isCreating}>
            {isCreating ? "Creating…" : "Create merchant user"}
          </Button>
        </form>
      </section>

      <MerchantUsersTable users={users} isLoading={isLoading} />
    </div>
  );
}

type FormInputProps = {
  label: string;
  name: string;
  type?: React.HTMLInputTypeAttribute;
  placeholder: string;
  pattern?: string;
  required?: boolean;
};

function FormInput({
  label,
  name,
  type = "text",
  placeholder,
  pattern,
  required = true,
}: FormInputProps) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      {label}
      <Input
        name={name}
        type={type}
        placeholder={placeholder}
        pattern={pattern}
        required={required}
      />
    </label>
  );
}

function MerchantUsersTable({
  users,
  isLoading,
}: {
  users: MerchantUser[];
  isLoading: boolean;
}) {
  async function exportUsers() {
    await exportExcelWorkbook(
      `merchant-accounts-${new Date().toISOString().slice(0, 10)}.xlsx`,
      [{
        name: "Merchant Accounts",
        headers: [
          "Owner",
          "Email",
          "Merchant",
          "Merchant Status",
          "Membership Role",
          "Stores",
          "Account Status",
          "Created",
        ],
        rows: users.map((user) => {
          const membership = user.memberships[0];
          return [
            user.name,
            user.email,
            membership?.merchant.name ?? "",
            membership?.merchant.status ?? "",
            membership?.role ?? "",
            membership?.merchant._count.stores ?? 0,
            user.isActive ? "Active" : "Inactive",
            new Date(user.createdAt),
          ];
        }),
        dateColumns: [7],
      }],
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b px-5 py-4">
        <div>
          <h2 className="font-semibold">Merchant users</h2>
          <p className="text-sm text-muted-foreground">
            Owners and their merchant organizations
          </p>
        </div>
        <Button
          variant="outline"
          disabled={!users.length}
          onClick={() => void exportUsers()}
        >
          <FileSpreadsheetIcon /> Export Excel
        </Button>
      </div>

      {isLoading ? (
        <p className="p-6 text-sm text-muted-foreground">Loading users…</p>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center p-10 text-center">
          <UserRoundIcon className="size-8 text-muted-foreground" />
          <p className="mt-3 font-medium">No merchant users yet</p>
          <p className="text-sm text-muted-foreground">
            Use the form to create the first merchant owner.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Owner</th>
                <th className="px-5 py-3 font-medium">Merchant</th>
                <th className="px-5 py-3 font-medium">Stores</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((user) => {
                const membership = user.memberships[0];

                return (
                  <tr key={user.id}>
                    <td className="px-5 py-4">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                      {membership?.merchant.phone ? (
                        <p className="text-xs text-muted-foreground">
                          {membership.merchant.phone}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-5 py-4">
                      <p>{membership?.merchant.name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">
                        {membership?.role ?? "—"}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5">
                        <StoreIcon className="size-4 text-muted-foreground" />
                        {membership?.merchant._count.stores ?? 0}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700">
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
