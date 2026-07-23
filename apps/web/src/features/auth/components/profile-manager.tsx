"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { changePassword, updateProfile } from "../auth-api";
import type { AuthenticatedUser } from "../types";

export function ProfileManager({ user }: { user: AuthenticatedUser }) {
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSaving(true);
    setMessage("");
    try {
      await updateProfile({
        name: String(data.get("name")),
        email: String(data.get("email")),
        currentPassword: String(data.get("currentPassword")),
      });
      setMessage("Profile updated");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid max-w-5xl gap-6 lg:grid-cols-2">
      <section className="h-fit rounded-2xl border bg-card p-6 shadow-sm">
        <h2 className="font-semibold">Personal information</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Update your Administrator name or login email.
        </p>
        <form className="space-y-4" onSubmit={submit}>
          <label className="grid gap-1.5 text-sm font-medium">
            Full name
            <Input name="name" defaultValue={user.name} minLength={2} required />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Email
            <Input name="email" type="email" defaultValue={user.email} required />
          </label>
          <PasswordField
            name="currentPassword"
            label="Current password to confirm"
            autoComplete="current-password"
          />
          {message ? <p className="text-sm" role="status">{message}</p> : null}
          <Button disabled={saving}>
            {saving ? "Saving…" : "Save information"}
          </Button>
        </form>
      </section>

      <ChangePasswordForm />
    </div>
  );
}

function ChangePasswordForm() {
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [success, setSuccess] = React.useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const newPassword = String(data.get("newPassword"));
    const confirmation = String(data.get("confirmation"));

    if (newPassword !== confirmation) {
      setSuccess(false);
      setMessage("New passwords do not match");
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      await changePassword({
        currentPassword: String(data.get("currentPassword")),
        newPassword,
      });
      form.reset();
      setSuccess(true);
      setMessage("Password changed successfully. Other devices were signed out.");
    } catch (error) {
      setSuccess(false);
      setMessage(
        error instanceof Error ? error.message : "Unable to change password",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="h-fit rounded-2xl border bg-card p-6 shadow-sm">
      <h2 className="font-semibold">Change password</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Use at least 8 characters. Your new password must be different.
      </p>
      <form className="space-y-4" onSubmit={submit}>
        <PasswordField
          name="currentPassword"
          label="Current password"
          autoComplete="current-password"
        />
        <PasswordField
          name="newPassword"
          label="New password"
          autoComplete="new-password"
        />
        <PasswordField
          name="confirmation"
          label="Confirm new password"
          autoComplete="new-password"
        />
        {message ? (
          <p
            className={`text-sm ${success ? "text-emerald-700" : "text-destructive"}`}
            role="status"
          >
            {message}
          </p>
        ) : null}
        <Button disabled={saving}>
          {saving ? "Changing…" : "Change password"}
        </Button>
      </form>
    </section>
  );
}

function PasswordField({
  name,
  label,
  autoComplete,
}: {
  name: string;
  label: string;
  autoComplete: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      {label}
      <Input
        name={name}
        type="password"
        minLength={8}
        autoComplete={autoComplete}
        required
      />
    </label>
  );
}
