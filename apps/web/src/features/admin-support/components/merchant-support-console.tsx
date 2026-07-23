"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangleIcon,
  Building2Icon,
  ExternalLinkIcon,
  LifeBuoyIcon,
  QrCodeIcon,
  RefreshCwIcon,
  SearchIcon,
  ShieldCheckIcon,
  StoreIcon,
  UserRoundIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getPublicStorePath } from "@/config/app-config";
import {
  deleteMembership,
  getSupportMerchants,
  resetSupportUserPassword,
  rotateStoreQrTokens,
  updateMerchantStatus,
  updateMembershipRole,
  updateSupportStore,
  updateSupportUser,
} from "../admin-support-api";
import type {
  MembershipRole,
  MerchantStatus,
  StoreStatus,
  SupportMerchant,
  SupportStore,
} from "../types";

type Filter = "ALL" | MerchantStatus | "NEEDS_ATTENTION";

export function MerchantSupportConsole() {
  const [merchants, setMerchants] = React.useState<SupportMerchant[]>([]);
  const [selectedId, setSelectedId] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<Filter>("ALL");
  const [loading, setLoading] = React.useState(true);
  const [message, setMessage] = React.useState("");
  const [temporaryPassword, setTemporaryPassword] = React.useState("");

  const loadMerchants = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSupportMerchants();
      setMerchants(data);
      setSelectedId((current) => current || data[0]?.id || "");
      setMessage("");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to load merchants",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadMerchants();
  }, [loadMerchants]);

  const filtered = merchants.filter((merchant) => {
    const matchesQuery =
      `${merchant.name} ${merchant.slug} ${merchant.contactEmail}`
        .toLowerCase()
        .includes(query.toLowerCase());
    const issueCount =
      merchant.diagnostics.length +
      merchant.stores.reduce(
        (total, store) => total + store.diagnostics.length,
        0,
      );
    const matchesFilter =
      filter === "ALL" ||
      merchant.status === filter ||
      (filter === "NEEDS_ATTENTION" && issueCount > 0);
    return matchesQuery && matchesFilter;
  });
  const selected =
    merchants.find((merchant) => merchant.id === selectedId) ?? filtered[0];
  const totalStores = merchants.reduce(
    (total, merchant) => total + merchant.stores.length,
    0,
  );
  const issueCount = merchants.reduce(
    (total, merchant) =>
      total +
      merchant.diagnostics.length +
      merchant.stores.reduce(
        (storeTotal, store) => storeTotal + store.diagnostics.length,
        0,
      ),
    0,
  );

  async function setMerchantStatus(
    merchant: SupportMerchant,
    status: MerchantStatus,
  ) {
    if (
      status === "SUSPENDED" &&
      !window.confirm(
        `Suspend ${merchant.name}? Its public stores will become unavailable.`,
      )
    ) {
      return;
    }
    try {
      await updateMerchantStatus(merchant.id, status);
      setMerchants((current) =>
        current.map((item) =>
          item.id === merchant.id ? { ...item, status } : item,
        ),
      );
      await loadMerchants();
      setMessage(`${merchant.name} is now ${status.toLowerCase()}`);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to update merchant",
      );
    }
  }

  async function setStoreState(
    merchantId: string,
    store: SupportStore,
    input: { status?: StoreStatus; isPublished?: boolean },
  ) {
    try {
      const result = await updateSupportStore(store.id, input);
      updateLocalStore(merchantId, store.id, (current) => ({
        ...current,
        status: result.status,
        isPublished: result.isPublished,
      }));
      await loadMerchants();
      setMessage(`${store.name} updated`);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to update store",
      );
    }
  }

  async function setUserState(
    merchantId: string,
    userId: string,
    isActive: boolean,
  ) {
    try {
      await updateSupportUser(userId, isActive);
      setMerchants((current) =>
        current.map((merchant) =>
          merchant.id === merchantId
            ? {
                ...merchant,
                users: merchant.users.map((user) =>
                  user.id === userId ? { ...user, isActive } : user,
                ),
              }
            : merchant,
        ),
      );
      await loadMerchants();
      setMessage(`User ${isActive ? "enabled" : "disabled"}`);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to update user",
      );
    }
  }

  async function resetPassword(userId: string) {
    if (
      !window.confirm(
        "Reset this user’s password and sign out all of their sessions?",
      )
    ) {
      return;
    }
    try {
      const result = await resetSupportUserPassword(userId);
      setTemporaryPassword(result.temporaryPassword);
      setMessage(
        "Password reset. Copy the temporary password now; it is shown only in this session.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to reset password",
      );
    }
  }

  async function changeMembershipRole(
    membershipId: string,
    role: MembershipRole,
  ) {
    try {
      await updateMembershipRole(membershipId, role);
      await loadMerchants();
      setMessage(`Membership role changed to ${role.toLowerCase()}`);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to change role",
      );
    }
  }

  async function removeMembership(membershipId: string) {
    if (!window.confirm("Remove this user from the merchant organization?")) {
      return;
    }
    try {
      await deleteMembership(membershipId);
      await loadMerchants();
      setMessage("Merchant membership removed");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to remove membership",
      );
    }
  }

  async function rotateQr(store: SupportStore) {
    if (
      !window.confirm(
        `Replace all QR security tokens for ${store.name}? Existing printed QR codes will stop working.`,
      )
    ) {
      return;
    }
    try {
      const result = await rotateStoreQrTokens(store.id);
      setMessage(
        `${result.updated} table QR code${result.updated === 1 ? "" : "s"} rotated. Ask the merchant to download and print them again.`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to rotate QR codes",
      );
    }
  }

  function updateLocalStore(
    merchantId: string,
    storeId: string,
    update: (store: SupportStore) => SupportStore,
  ) {
    setMerchants((current) =>
      current.map((merchant) =>
        merchant.id === merchantId
          ? {
              ...merchant,
              stores: merchant.stores.map((store) =>
                store.id === storeId ? update(store) : store,
              ),
            }
          : merchant,
      ),
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-zinc-950 p-6 text-white shadow-sm md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm text-white/60">
              <LifeBuoyIcon className="size-4" /> Platform support
            </p>
            <h2 className="mt-2 text-3xl font-semibold">
              Merchant control center
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-white/60">
              Diagnose configuration issues and apply explicit account or store
              support actions.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-5 rounded-xl bg-white/5 px-5 py-4 text-center">
            <Summary value={merchants.length} label="Merchants" />
            <Summary value={totalStores} label="Stores" />
            <Summary
              value={issueCount}
              label="Issues"
              warning={issueCount > 0}
            />
          </div>
        </div>
      </section>

      <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
        <label className="relative">
          <SearchIcon className="absolute left-3 top-3 size-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search merchant, slug, or email…"
            className="pl-9"
          />
        </label>
        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value as Filter)}
          className="h-10 rounded-lg border bg-background px-3 text-sm"
        >
          <option value="ALL">All merchants</option>
          <option value="ACTIVE">Active</option>
          <option value="PENDING">Pending</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="NEEDS_ATTENTION">Needs attention</option>
        </select>
        <Button variant="outline" onClick={() => void loadMerchants()}>
          <RefreshCwIcon /> Refresh
        </Button>
      </div>

      {message ? (
        <p className="rounded-xl border bg-card p-3 text-sm">{message}</p>
      ) : null}
      {temporaryPassword ? (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase text-amber-700">
              Temporary password
            </p>
            <code className="mt-1 block select-all break-all font-semibold text-amber-950">
              {temporaryPassword}
            </code>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              void navigator.clipboard.writeText(temporaryPassword);
              setMessage("Temporary password copied");
            }}
          >
            Copy password
          </Button>
          <Button variant="ghost" onClick={() => setTemporaryPassword("")}>
            Hide
          </Button>
        </div>
      ) : null}

      {loading && !merchants.length ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          Loading platform merchants…
        </p>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[20rem_1fr]">
          <aside className="h-fit rounded-2xl border bg-card p-3 shadow-sm">
            <p className="px-2 pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {filtered.length} results
            </p>
            {filtered.map((merchant) => {
              const issues =
                merchant.diagnostics.length +
                merchant.stores.reduce(
                  (total, store) => total + store.diagnostics.length,
                  0,
                );
              return (
                <button
                  key={merchant.id}
                  type="button"
                  onClick={() => setSelectedId(merchant.id)}
                  className={`flex w-full items-center gap-3 rounded-xl p-3 text-left ${
                    selected?.id === merchant.id
                      ? "bg-muted"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <span className="grid size-9 place-items-center rounded-xl border bg-background">
                    <Building2Icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {merchant.name}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {merchant.stores.length} stores · {merchant.status}
                    </span>
                  </span>
                  {issues ? (
                    <span className="grid size-6 place-items-center rounded-full bg-amber-100 text-xs font-semibold text-amber-700">
                      {issues}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </aside>

          {selected ? (
            <MerchantDetail
              merchant={selected}
              onStatusChange={(status) =>
                void setMerchantStatus(selected, status)
              }
              onStoreChange={(store, input) =>
                void setStoreState(selected.id, store, input)
              }
              onUserChange={(userId, active) =>
                void setUserState(selected.id, userId, active)
              }
              onResetPassword={(userId) => void resetPassword(userId)}
              onRoleChange={(membershipId, role) =>
                void changeMembershipRole(membershipId, role)
              }
              onMembershipRemove={(membershipId) =>
                void removeMembership(membershipId)
              }
              onRotateQr={(store) => void rotateQr(store)}
            />
          ) : (
            <EmptyMerchants />
          )}
        </div>
      )}
    </div>
  );
}

function MerchantDetail({
  merchant,
  onStatusChange,
  onStoreChange,
  onUserChange,
  onResetPassword,
  onRoleChange,
  onMembershipRemove,
  onRotateQr,
}: {
  merchant: SupportMerchant;
  onStatusChange: (status: MerchantStatus) => void;
  onStoreChange: (
    store: SupportStore,
    input: { status?: StoreStatus; isPublished?: boolean },
  ) => void;
  onUserChange: (userId: string, active: boolean) => void;
  onResetPassword: (userId: string) => void;
  onRoleChange: (membershipId: string, role: MembershipRole) => void;
  onMembershipRemove: (membershipId: string) => void;
  onRotateQr: (store: SupportStore) => void;
}) {
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-semibold">{merchant.name}</h2>
              <StatusBadge status={merchant.status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {merchant.contactEmail}
              {merchant.phone ? ` · ${merchant.phone}` : ""}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              /{merchant.slug} · Created{" "}
              {new Date(merchant.createdAt).toLocaleDateString()}
            </p>
          </div>
          <select
            value={merchant.status}
            onChange={(event) =>
              onStatusChange(event.target.value as MerchantStatus)
            }
            className="h-10 rounded-lg border bg-background px-3 text-sm font-medium"
          >
            <option value="PENDING">Pending review</option>
            <option value="ACTIVE">Activate merchant</option>
            <option value="SUSPENDED">Suspend merchant</option>
          </select>
        </div>
        <Diagnostics messages={merchant.diagnostics} />
      </section>

      <section>
        <h3 className="mb-3 flex items-center gap-2 font-semibold">
          <StoreIcon className="size-4" /> Stores
        </h3>
        <div className="space-y-4">
          {merchant.stores.map((store) => (
            <StoreSupportCard
              key={store.id}
              merchant={merchant}
              store={store}
              onChange={(input) => onStoreChange(store, input)}
              onRotateQr={() => onRotateQr(store)}
            />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border bg-card shadow-sm">
        <div className="border-b p-5">
          <h3 className="flex items-center gap-2 font-semibold">
            <UserRoundIcon className="size-4" /> Merchant access
          </h3>
        </div>
        <div className="divide-y">
          {merchant.users.map((user) => (
            <div key={user.id} className="flex items-center gap-4 p-4 sm:p-5">
              <span className="grid size-9 place-items-center rounded-full bg-muted text-sm font-semibold">
                {user.name.charAt(0)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {user.email} · {user.role}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={user.role}
                  onChange={(event) =>
                    onRoleChange(
                      user.membershipId,
                      event.target.value as MembershipRole,
                    )
                  }
                  className="h-8 rounded-lg border bg-background px-2 text-xs"
                >
                  <option value="OWNER">Owner</option>
                  <option value="MANAGER">Manager</option>
                  <option value="STAFF">Staff</option>
                </select>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onResetPassword(user.id)}
                >
                  Reset password
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => onMembershipRemove(user.membershipId)}
                >
                  Remove
                </Button>
                <button
                  type="button"
                  onClick={() => onUserChange(user.id, !user.isActive)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                    user.isActive
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  {user.isActive ? "Active" : "Disabled"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StoreSupportCard({
  merchant,
  store,
  onChange,
  onRotateQr,
}: {
  merchant: SupportMerchant;
  store: SupportStore;
  onChange: (input: { status?: StoreStatus; isPublished?: boolean }) => void;
  onRotateQr: () => void;
}) {
  const path = getPublicStorePath(merchant.slug, store.slug);
  return (
    <article className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">{store.name}</h4>
            <StatusBadge status={store.status} />
            <StatusBadge status={store.isPublished ? "PUBLISHED" : "DRAFT"} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {store.currency} · Updated{" "}
            {new Date(store.updatedAt).toLocaleString()}
          </p>
        </div>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href={path} target="_blank" />}
        >
          <ExternalLinkIcon /> Open storefront
        </Button>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {Object.entries(store.counts).map(([label, value]) => (
          <div key={label} className="rounded-xl bg-muted/60 p-3">
            <p className="text-lg font-semibold">{value}</p>
            <p className="truncate text-[11px] capitalize text-muted-foreground">
              {label.replace(/([A-Z])/g, " $1")}
            </p>
          </div>
        ))}
      </div>
      <Diagnostics messages={store.diagnostics} />
      <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
        <Button
          variant="outline"
          onClick={() =>
            onChange({
              status: store.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
            })
          }
        >
          {store.status === "ACTIVE" ? "Disable store" : "Enable store"}
        </Button>
        <Button
          variant="outline"
          onClick={() => onChange({ isPublished: !store.isPublished })}
        >
          {store.isPublished ? "Unpublish" : "Publish storefront"}
        </Button>
        <Button variant="outline" onClick={onRotateQr}>
          <QrCodeIcon /> Rotate QR security
        </Button>
      </div>
    </article>
  );
}

function Diagnostics({ messages }: { messages: string[] }) {
  if (!messages.length) {
    return (
      <p className="mt-4 flex items-center gap-2 text-sm text-emerald-700">
        <ShieldCheckIcon className="size-4" /> No configuration issues detected
      </p>
    );
  }
  return (
    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
      <p className="flex items-center gap-2 text-sm font-medium text-amber-800">
        <AlertTriangleIcon className="size-4" /> Support checks
      </p>
      <ul className="mt-2 list-inside list-disc text-xs leading-5 text-amber-700">
        {messages.map((message) => (
          <li key={message}>{message}</li>
        ))}
      </ul>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const positive = ["ACTIVE", "PUBLISHED"].includes(status);
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        positive
          ? "bg-emerald-100 text-emerald-700"
          : status === "SUSPENDED" || status === "INACTIVE"
            ? "bg-red-100 text-red-700"
            : "bg-amber-100 text-amber-700"
      }`}
    >
      {status}
    </span>
  );
}

function Summary({
  value,
  label,
  warning,
}: {
  value: number;
  label: string;
  warning?: boolean;
}) {
  return (
    <div>
      <p
        className={`text-2xl font-semibold ${warning ? "text-amber-300" : ""}`}
      >
        {value}
      </p>
      <p className="text-xs text-white/50">{label}</p>
    </div>
  );
}

function EmptyMerchants() {
  return (
    <section className="rounded-2xl border border-dashed p-12 text-center">
      <Building2Icon className="mx-auto size-9 text-muted-foreground" />
      <p className="mt-3 text-sm text-muted-foreground">
        No merchants match the current filters.
      </p>
    </section>
  );
}
