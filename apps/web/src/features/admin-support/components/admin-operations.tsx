"use client";

import * as React from "react";
import {
  ActivityIcon,
  CreditCardIcon,
  EyeIcon,
  RefreshCwIcon,
  RotateCcwIcon,
  ShieldCheckIcon,
  Trash2Icon,
  UserRoundCheckIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showErrorToast, showSuccessToast } from "@/lib/toast";

type Plan = {
  id: string;
  name: string;
  monthlyPrice: string;
  yearlyPrice: string;
  maxStores: number;
  maxProducts: number;
  maxUsers: number;
  storageMb: number;
};

type Merchant = {
  id: string;
  name: string;
  contactEmail: string;
  status: string;
  onboardingStatus: string;
  onboardingNotes: string | null;
  deletedAt: string | null;
  subscription: null | {
    status: string;
    billingInterval: string;
    currentPeriodEnd: string;
    plan: Plan;
  };
  _count: { stores: number; members: number; payments: number };
};

type Session = {
  id: string;
  createdAt: string;
  expiresAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  user: { name: string; email: string; role: string };
};

type OperationsData = {
  plans: Plan[];
  merchants: Merchant[];
  payments: Array<{
    id: string;
    amount: string;
    currency: string;
    method: string;
    status: string;
    reference: string | null;
    createdAt: string;
    merchant: { name: string };
  }>;
  sessions: Session[];
  users: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    failedLoginAttempts: number;
    lockedUntil: string | null;
    lastLoginAt: string | null;
    deletedAt: string | null;
    deletedReason: string | null;
  }>;
  monitoring: {
    lockedUsers: number;
    expiredSubscriptions: number;
    pendingOnboarding: number;
    deletedMerchants: number;
    activeSessions: number;
  };
};

export function AdminOperations() {
  const [data, setData] = React.useState<OperationsData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [preview, setPreview] = React.useState<Record<string, unknown> | null>(
    null,
  );

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/operations");
      if (!response.ok) throw new Error(await readError(response));
      setData(await response.json());
    } catch (error) {
      showErrorToast(
        "Unable to load platform operations",
        error instanceof Error ? error.message : undefined,
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => void load(), [load]);

  async function runAction(
    input: Record<string, unknown>,
    success: string,
    options: { reload?: boolean } = { reload: true },
  ) {
    try {
      const response = await fetch("/api/admin/operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error(await readError(response));
      const result = await response.json();
      showSuccessToast(success);
      if (options.reload !== false) await load();
      return result;
    } catch (error) {
      showErrorToast(
        "Operation failed",
        error instanceof Error ? error.message : undefined,
      );
      return null;
    }
  }

  if (loading && !data) {
    return <p className="py-16 text-center text-sm">Loading operations…</p>;
  }
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric
          label="Review queue"
          value={data.monitoring.pendingOnboarding}
          icon={UserRoundCheckIcon}
        />
        <Metric
          label="Expired plans"
          value={data.monitoring.expiredSubscriptions}
          icon={CreditCardIcon}
        />
        <Metric
          label="Locked users"
          value={data.monitoring.lockedUsers}
          icon={ShieldCheckIcon}
        />
        <Metric
          label="Active sessions"
          value={data.monitoring.activeSessions}
          icon={ActivityIcon}
        />
        <Metric
          label="Deleted merchants"
          value={data.monitoring.deletedMerchants}
          icon={Trash2Icon}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <PlanCreator
          onCreate={async (input) => {
            await runAction(
              { action: "CREATE_PLAN", ...input },
              "Subscription plan created",
            );
          }}
        />
        <PaymentRecorder
          merchants={data.merchants.filter((merchant) => !merchant.deletedAt)}
          onRecord={async (input) => {
            await runAction(
              { action: "RECORD_PAYMENT", ...input },
              "Payment recorded and audited",
            );
          }}
        />
      </div>

      <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <header className="flex items-center justify-between border-b p-5">
          <div>
            <h2 className="font-semibold">Merchant lifecycle</h2>
            <p className="text-sm text-muted-foreground">
              Onboarding, plans, soft deletion, restoration, and support
              preview.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => void load()}>
            <RefreshCwIcon /> Refresh
          </Button>
        </header>
        <div className="divide-y">
          {data.merchants.map((merchant) => (
            <MerchantRow
              key={merchant.id}
              merchant={merchant}
              plans={data.plans}
              onAction={runAction}
              onPreview={async () => {
                const result = await runAction(
                  { action: "PREVIEW_MERCHANT", merchantId: merchant.id },
                  "Read-only merchant preview opened",
                  { reload: false },
                );
                if (result) setPreview(result);
              }}
            />
          ))}
        </div>
      </section>

      {preview ? (
        <ReadOnlyPreview value={preview} onClose={() => setPreview(null)} />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <RecentPayments payments={data.payments} />
        <SessionList
          sessions={data.sessions}
          onRevoke={(sessionId) =>
            runAction(
              { action: "REVOKE_SESSION", sessionId },
              "Session revoked",
            ).then(() => undefined)
          }
        />
      </div>
      <UserLifecycle users={data.users} onAction={runAction} />
    </div>
  );
}

function UserLifecycle({
  users,
  onAction,
}: {
  users: OperationsData["users"];
  onAction: (
    input: Record<string, unknown>,
    success: string,
  ) => Promise<unknown>;
}) {
  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm">
      <h2 className="font-semibold">User access and recovery</h2>
      <p className="text-sm text-muted-foreground">
        Review lockouts, last login activity, soft deletion, and restoration.
      </p>
      <div className="mt-4 divide-y">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-sm font-medium">
                {user.name} · {user.role}
              </p>
              <p className="text-xs text-muted-foreground">
                {user.email} · {user.failedLoginAttempts} failed attempts ·{" "}
                {user.lastLoginAt
                  ? `last login ${new Date(user.lastLoginAt).toLocaleString()}`
                  : "never signed in"}
              </p>
            </div>
            {user.deletedAt ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  void onAction(
                    { action: "RESTORE_USER", userId: user.id },
                    "User restored",
                  )
                }
              >
                <RotateCcwIcon /> Restore
              </Button>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive"
                onClick={() => {
                  const reason = window.prompt(
                    "Reason for deleting this user?",
                  );
                  if (reason)
                    void onAction(
                      {
                        action: "SOFT_DELETE_USER",
                        userId: user.id,
                        reason,
                      },
                      "User access removed and sessions revoked",
                    );
                }}
              >
                <Trash2Icon /> Soft delete
              </Button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function MerchantRow({
  merchant,
  plans,
  onAction,
  onPreview,
}: {
  merchant: Merchant;
  plans: Plan[];
  onAction: (
    input: Record<string, unknown>,
    success: string,
  ) => Promise<unknown>;
  onPreview: () => Promise<void>;
}) {
  const [planId, setPlanId] = React.useState(
    merchant.subscription?.plan.id ?? plans[0]?.id ?? "",
  );
  return (
    <article className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold">{merchant.name}</h3>
          <Badge>{merchant.onboardingStatus.replaceAll("_", " ")}</Badge>
          <Badge>{merchant.subscription?.status ?? "NO PLAN"}</Badge>
          {merchant.deletedAt ? <Badge>DELETED</Badge> : null}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {merchant.contactEmail} · {merchant._count.stores} stores ·{" "}
          {merchant._count.members} users
        </p>
        {merchant.subscription ? (
          <p className="mt-1 text-xs text-muted-foreground">
            {merchant.subscription.plan.name} · renews{" "}
            {new Date(
              merchant.subscription.currentPeriodEnd,
            ).toLocaleDateString()}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={planId}
          onChange={(event) => setPlanId(event.target.value)}
          className="h-9 rounded-md border bg-background px-2 text-xs"
        >
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          variant="outline"
          disabled={!planId}
          onClick={() =>
            void onAction(
              {
                action: "ASSIGN_PLAN",
                merchantId: merchant.id,
                planId,
                billingInterval: "MONTHLY",
                status: "ACTIVE",
              },
              "Subscription assigned",
            )
          }
        >
          <CreditCardIcon /> Assign
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            void onAction(
              {
                action: "UPDATE_ONBOARDING",
                merchantId: merchant.id,
                onboardingStatus: "APPROVED",
                notes: "Approved from operations workspace",
              },
              "Merchant approved",
            )
          }
        >
          <UserRoundCheckIcon /> Approve
        </Button>
        <Button size="sm" variant="outline" onClick={() => void onPreview()}>
          <EyeIcon /> Preview
        </Button>
        {merchant.deletedAt ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              void onAction(
                { action: "RESTORE_MERCHANT", merchantId: merchant.id },
                "Merchant restored",
              )
            }
          >
            <RotateCcwIcon /> Restore
          </Button>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive"
            onClick={() => {
              const reason = window.prompt("Reason for soft deletion?");
              if (reason)
                void onAction(
                  {
                    action: "SOFT_DELETE_MERCHANT",
                    merchantId: merchant.id,
                    reason,
                  },
                  "Merchant moved to deleted records",
                );
            }}
          >
            <Trash2Icon /> Delete
          </Button>
        )}
      </div>
    </article>
  );
}

function PlanCreator({
  onCreate,
}: {
  onCreate: (input: Record<string, unknown>) => Promise<void>;
}) {
  return (
    <form
      className="rounded-2xl border bg-card p-5 shadow-sm"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const input: Record<string, unknown> = Object.fromEntries(form);
        for (const key of [
          "monthlyPrice",
          "yearlyPrice",
          "maxStores",
          "maxProducts",
          "maxUsers",
          "storageMb",
        ]) {
          input[key] = Number(input[key]);
        }
        void onCreate(input);
        event.currentTarget.reset();
      }}
    >
      <h2 className="font-semibold">Create subscription plan</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Input name="name" placeholder="Plan name" required />
        <Input
          name="monthlyPrice"
          type="number"
          min="0.01"
          step="0.01"
          placeholder="Monthly USD"
          required
        />
        <Input
          name="yearlyPrice"
          type="number"
          min="0.01"
          step="0.01"
          placeholder="Yearly USD"
          required
        />
        <Input
          name="maxStores"
          type="number"
          min="1"
          placeholder="Store limit"
          required
        />
        <Input
          name="maxProducts"
          type="number"
          min="1"
          placeholder="Product limit"
          required
        />
        <Input
          name="maxUsers"
          type="number"
          min="1"
          placeholder="User limit"
          required
        />
        <Input
          name="storageMb"
          type="number"
          min="1"
          placeholder="Storage MB"
          required
        />
        <Button type="submit">Create plan</Button>
      </div>
    </form>
  );
}

function PaymentRecorder({
  merchants,
  onRecord,
}: {
  merchants: Merchant[];
  onRecord: (input: Record<string, unknown>) => Promise<void>;
}) {
  return (
    <form
      className="rounded-2xl border bg-card p-5 shadow-sm"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const input: Record<string, unknown> = Object.fromEntries(form);
        input.amount = Number(input.amount);
        void onRecord(input);
        event.currentTarget.reset();
      }}
    >
      <h2 className="font-semibold">Record manual payment</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <select
          name="merchantId"
          required
          className="h-9 rounded-md border bg-background px-3 text-sm"
        >
          <option value="">Select merchant</option>
          {merchants.map((merchant) => (
            <option key={merchant.id} value={merchant.id}>
              {merchant.name}
            </option>
          ))}
        </select>
        <Input
          name="amount"
          type="number"
          min="0.01"
          step="0.01"
          placeholder="Amount"
          required
        />
        <select
          name="method"
          className="h-9 rounded-md border bg-background px-3 text-sm"
        >
          {["ABA", "WING", "BANK_TRANSFER", "CASH", "OTHER"].map((method) => (
            <option key={method}>{method.replaceAll("_", " ")}</option>
          ))}
        </select>
        <Input name="reference" placeholder="Reference (optional)" />
        <input type="hidden" name="currency" value="USD" />
        <input type="hidden" name="status" value="PAID" />
        <Button type="submit">Record payment</Button>
      </div>
    </form>
  );
}

function RecentPayments({
  payments,
}: {
  payments: OperationsData["payments"];
}) {
  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm">
      <h2 className="font-semibold">Recent payments</h2>
      <div className="mt-3 divide-y">
        {payments.slice(0, 8).map((payment) => (
          <div
            key={payment.id}
            className="flex justify-between gap-3 py-3 text-sm"
          >
            <span>
              <span className="block font-medium">{payment.merchant.name}</span>
              <span className="text-xs text-muted-foreground">
                {payment.method} · {payment.reference ?? "No reference"}
              </span>
            </span>
            <span className="font-semibold">
              {payment.currency} {Number(payment.amount).toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function SessionList({
  sessions,
  onRevoke,
}: {
  sessions: Session[];
  onRevoke: (id: string) => Promise<void>;
}) {
  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm">
      <h2 className="font-semibold">Active sessions</h2>
      <div className="mt-3 max-h-80 divide-y overflow-y-auto">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="flex items-center justify-between gap-3 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {session.user.name} · {session.user.role}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {session.ipAddress ?? "Unknown IP"} ·{" "}
                {session.userAgent ?? "Unknown device"}
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => void onRevoke(session.id)}
            >
              Revoke
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}

function ReadOnlyPreview({
  value,
  onClose,
}: {
  value: Record<string, unknown>;
  onClose: () => void;
}) {
  return (
    <section className="rounded-2xl border-2 border-amber-400 bg-amber-50 p-5 text-amber-950 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider">
            Read-only support preview
          </p>
          <h2 className="mt-1 text-xl font-semibold">
            {String(value.name ?? "Merchant")}
          </h2>
        </div>
        <Button variant="outline" onClick={onClose}>
          Exit preview
        </Button>
      </div>
      <pre className="mt-4 max-h-80 overflow-auto rounded-xl bg-white/70 p-4 text-xs">
        {JSON.stringify(value, null, 2)}
      </pre>
    </section>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <Icon className="size-4 text-muted-foreground" />
      <p className="mt-4 text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold">
      {children}
    </span>
  );
}

async function readError(response: Response) {
  const body = (await response.json().catch(() => null)) as {
    message?: string;
  } | null;
  return body?.message ?? `Request failed (${response.status})`;
}
