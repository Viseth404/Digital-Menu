"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateProfile } from "../auth-api";
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
    <section className="max-w-xl rounded-2xl border bg-card p-6 shadow-sm">
      <h2 className="font-semibold">Personal information</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Your current password is required to save account changes.
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
        <label className="grid gap-1.5 text-sm font-medium">
          Current password
          <Input
            name="currentPassword"
            type="password"
            minLength={8}
            autoComplete="current-password"
            required
          />
        </label>
        {message ? <p className="text-sm" role="status">{message}</p> : null}
        <Button disabled={saving}>{saving ? "Saving…" : "Save information"}</Button>
      </form>
    </section>
  );
}
