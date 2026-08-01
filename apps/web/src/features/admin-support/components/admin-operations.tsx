"use client";

import * as React from "react";
import {
  ActivityIcon,
  AlertTriangleIcon,
  CalendarClockIcon,
  CreditCardIcon,
  EyeIcon,
  PencilIcon,
  PowerIcon,
  RefreshCwIcon,
  RotateCcwIcon,
  ShieldCheckIcon,
  Trash2Icon,
  UserRoundCheckIcon,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { formatStorage } from "@/features/stores/format";

type Plan = {
  id: string;
  name: string;
  description: string | null;
  monthlyPrice: string;
  yearlyPrice: string;
  maxStores: number;
  maxProducts: number;
  maxUsers: number;
  storageMb: number;
  isActive: boolean;
  _count: { subscriptions: number };
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
    graceEndsAt: string;
    plan: Plan;
  };
  quota: null | {
    products: { used: number; limit: number };
    storage: { usedBytes: number; limitBytes: number };
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
    dueSoonSubscriptions: number;
    pastDueSubscriptions: number;
    pendingOnboarding: number;
    deletedMerchants: number;
    activeSessions: number;
  };
  billingPolicy: { gracePeriodDays: number };
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
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Metric
          label="Review queue"
          value={data.monitoring.pendingOnboarding}
          icon={UserRoundCheckIcon}
        />
        <Metric
          label="Due in 7 days"
          value={data.monitoring.dueSoonSubscriptions}
          icon={CalendarClockIcon}
        />
        <Metric
          label="In grace period"
          value={data.monitoring.pastDueSubscriptions}
          icon={AlertTriangleIcon}
        />
        <Metric
          label="Access closed"
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
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <PlanManager plans={data.plans} onAction={runAction} />
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
              Plans update automatically after payment. Overdue merchants get a
              {` ${data.billingPolicy.gracePeriodDays}-day grace period before access closes.`}
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
        <RecentPayments
          payments={data.payments}
          onDelete={(paymentId) =>
            runAction(
              { action: "DELETE_PAYMENT", paymentId },
              "Payment record deleted",
            ).then(() => undefined)
          }
        />
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
  const [billingInterval, setBillingInterval] = React.useState(
    merchant.subscription?.billingInterval ?? "MONTHLY",
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
        {merchant.quota ? (
          <p className="mt-1 text-xs text-muted-foreground">
            Products {merchant.quota.products.used}/
            {merchant.quota.products.limit} · Storage{" "}
            {formatStorage(merchant.quota.storage.usedBytes)}/
            {formatStorage(merchant.quota.storage.limitBytes)}
          </p>
        ) : null}
        {merchant.subscription ? (
          <p className="mt-1 text-xs text-muted-foreground">
            {merchant.subscription.plan.name} ·{" "}
            {merchant.subscription.status === "PAST_DUE"
              ? `grace ends ${new Date(merchant.subscription.graceEndsAt).toLocaleDateString()}`
              : merchant.subscription.status === "EXPIRED"
                ? `access closed ${new Date(merchant.subscription.graceEndsAt).toLocaleDateString()}`
                : `renews ${new Date(merchant.subscription.currentPeriodEnd).toLocaleDateString()}`}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={planId}
          onChange={(event) => setPlanId(event.target.value)}
          className="h-9 rounded-md border bg-background px-2 text-xs"
        >
          {plans
            .filter(
              (plan) =>
                plan.isActive || plan.id === merchant.subscription?.plan.id,
            )
            .map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name}
                {plan.isActive ? "" : " (inactive)"}
              </option>
            ))}
        </select>
        <select
          value={billingInterval}
          onChange={(event) => setBillingInterval(event.target.value)}
          className="h-9 rounded-md border bg-background px-2 text-xs"
          aria-label={`Billing interval for ${merchant.name}`}
        >
          <option value="MONTHLY">Monthly</option>
          <option value="YEARLY">Yearly</option>
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
                billingInterval,
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

function PlanManager({
  plans,
  onAction,
}: {
  plans: Plan[];
  onAction: (
    input: Record<string, unknown>,
    success: string,
  ) => Promise<unknown>;
}) {
  const [editingPlan, setEditingPlan] = React.useState<Plan | null>(null);
  const [deletePlan, setDeletePlan] = React.useState<Plan | null>(null);

  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm">
      <h2 className="font-semibold">
        {editingPlan ? `Edit ${editingPlan.name}` : "Subscription plans"}
      </h2>
      <p className="text-sm text-muted-foreground">
        Create packages, correct plan details, or retire plans safely.
      </p>

      <form
        key={editingPlan?.id ?? "new"}
        className="mt-4 grid gap-3 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          const formElement = event.currentTarget;
          const form = new FormData(formElement);
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
          void onAction(
            {
              action: editingPlan ? "UPDATE_PLAN" : "CREATE_PLAN",
              ...(editingPlan ? { planId: editingPlan.id } : {}),
              ...input,
            },
            editingPlan
              ? "Subscription plan updated"
              : "Subscription plan created",
          ).then((result) => {
            if (!result) return;
            setEditingPlan(null);
            formElement.reset();
          });
        }}
      >
        <Input
          name="name"
          placeholder="Plan name"
          defaultValue={editingPlan?.name}
          required
        />
        <Input
          name="description"
          placeholder="Short description (optional)"
          defaultValue={editingPlan?.description ?? ""}
        />
        <PlanNumberInput
          name="monthlyPrice"
          placeholder="Monthly USD"
          step="0.01"
          defaultValue={editingPlan?.monthlyPrice}
        />
        <PlanNumberInput
          name="yearlyPrice"
          placeholder="Yearly USD"
          step="0.01"
          defaultValue={editingPlan?.yearlyPrice}
        />
        <PlanNumberInput
          name="maxStores"
          placeholder="Store limit"
          defaultValue={editingPlan?.maxStores}
        />
        <PlanNumberInput
          name="maxProducts"
          placeholder="Product limit"
          defaultValue={editingPlan?.maxProducts}
        />
        <PlanNumberInput
          name="maxUsers"
          placeholder="User limit"
          defaultValue={editingPlan?.maxUsers}
        />
        <PlanNumberInput
          name="storageMb"
          placeholder="Storage MB"
          defaultValue={editingPlan?.storageMb}
        />
        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit">
            {editingPlan ? "Save changes" : "Create plan"}
          </Button>
          {editingPlan ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingPlan(null)}
            >
              Cancel
            </Button>
          ) : null}
        </div>
      </form>

      <div className="mt-5 divide-y border-t">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium">{plan.name}</p>
                <Badge>{plan.isActive ? "ACTIVE" : "INACTIVE"}</Badge>
                <span className="text-xs text-muted-foreground">
                  {plan._count.subscriptions} assigned
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                ${plan.monthlyPrice}/month · ${plan.yearlyPrice}/year ·{" "}
                {plan.maxStores} stores · {plan.maxProducts} products
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditingPlan(plan)}
              >
                <PencilIcon /> Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  void onAction(
                    {
                      action: "SET_PLAN_ACTIVE",
                      planId: plan.id,
                      isActive: !plan.isActive,
                    },
                    plan.isActive ? "Plan deactivated" : "Plan reactivated",
                  )
                }
              >
                <PowerIcon /> {plan.isActive ? "Deactivate" : "Reactivate"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive"
                onClick={() => setDeletePlan(plan)}
              >
                <Trash2Icon /> Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      <AlertDialog
        open={Boolean(deletePlan)}
        onOpenChange={(open) => {
          if (!open) setDeletePlan(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deletePlan?.name ?? "this plan"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deletePlan?._count.subscriptions
                ? `This plan is assigned to ${deletePlan._count.subscriptions} merchant subscription(s), so it cannot be deleted. Deactivate it instead to preserve billing history.`
                : "This permanently removes the unused plan. This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {deletePlan?._count.subscriptions ? "Close" : "Cancel"}
            </AlertDialogCancel>
            {deletePlan && deletePlan._count.subscriptions === 0 ? (
              <AlertDialogAction
                variant="destructive"
                onClick={() => {
                  const planId = deletePlan.id;
                  setDeletePlan(null);
                  void onAction(
                    { action: "DELETE_PLAN", planId },
                    "Unused subscription plan deleted",
                  );
                }}
              >
                Delete permanently
              </AlertDialogAction>
            ) : null}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function PlanNumberInput({
  name,
  placeholder,
  defaultValue,
  step = "1",
}: {
  name: string;
  placeholder: string;
  defaultValue?: string | number;
  step?: string;
}) {
  return (
    <Input
      name={name}
      type="number"
      min={step === "0.01" ? "0.01" : "1"}
      step={step}
      placeholder={placeholder}
      defaultValue={defaultValue}
      required
    />
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
      <p className="mt-1 text-xs text-muted-foreground">
        A paid record automatically activates the merchant and renews its
        monthly or yearly billing period.
      </p>
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
  onDelete,
}: {
  payments: OperationsData["payments"];
  onDelete: (id: string) => Promise<void>;
}) {
  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm">
      <h2 className="font-semibold">Recent payments</h2>
      <div className="mt-3 max-h-96 divide-y overflow-y-auto">
        {payments.map((payment) => (
          <div
            key={payment.id}
            className="flex items-center justify-between gap-3 py-3 text-sm"
          >
            <span className="min-w-0">
              <span className="block font-medium">{payment.merchant.name}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {payment.status} · {payment.method} ·{" "}
                {payment.reference ?? "No reference"} ·{" "}
                {new Date(payment.createdAt).toLocaleDateString()}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <span className="font-semibold">
                {payment.currency} {Number(payment.amount).toFixed(2)}
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive"
                aria-label={`Delete payment for ${payment.merchant.name}`}
                onClick={() => {
                  if (
                    window.confirm(
                      "Delete this payment record? This removes it from payment history but does not change the merchant’s current renewal dates.",
                    )
                  ) {
                    void onDelete(payment.id);
                  }
                }}
              >
                <Trash2Icon />
              </Button>
            </span>
          </div>
        ))}
        {!payments.length ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No payments recorded yet.
          </p>
        ) : null}
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
