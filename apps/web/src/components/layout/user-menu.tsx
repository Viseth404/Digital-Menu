"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronsUpDownIcon, KeyRoundIcon, LogOutIcon, XIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { changePassword, logout } from "@/features/auth/auth-api";
import { AuthenticatedUser } from "@/features/auth/types";
import { appConfig } from "@/config/app-config";

type UserMenuProps = {
  user: AuthenticatedUser | null;
};

export function UserMenu({ user }: UserMenuProps) {
  const router = useRouter();
  const { isMobile } = useSidebar();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const [showPasswordForm, setShowPasswordForm] = React.useState(false);

  const name = user?.name ?? "Loading…";
  const email = user?.email ?? "";
  const initials = getInitials(name);

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await logout();
      router.replace(appConfig.routes.login);
      router.refresh();
    } catch {
      setIsLoggingOut(false);
    }
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            disabled={!user}
            render={<SidebarMenuButton size="lg" />}
          >
            <Avatar>
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{name}</span>
              <span className="truncate text-xs">{email}</span>
            </div>
            <ChevronsUpDownIcon className="ml-auto size-4" />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="min-w-56"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <p className="font-medium">{name}</p>
                <p className="text-xs font-normal text-muted-foreground">
                  {email}
                </p>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            {user?.role === "MERCHANT" || user?.role === "ADMIN" ? (
              <DropdownMenuItem onClick={() => setShowPasswordForm(true)}>
                <KeyRoundIcon />
                Change password
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem
              disabled={isLoggingOut}
              onClick={handleLogout}
              variant="destructive"
            >
              <LogOutIcon />
              {isLoggingOut ? "Logging out…" : "Log out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
      {showPasswordForm ? (
        <ChangePasswordModal onClose={() => setShowPasswordForm(false)} />
      ) : null}
    </>
  );
}

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [success, setSuccess] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
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
      setMessage("Password changed. Other signed-in devices were logged out.");
    } catch (error) {
      setSuccess(false);
      setMessage(error instanceof Error ? error.message : "Unable to change password");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <section
        className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-password-title"
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 id="change-password-title" className="font-semibold">
              Change your password
            </h2>
            <p className="text-sm text-muted-foreground">
              Use at least 8 characters.
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <XIcon />
            <span className="sr-only">Close</span>
          </Button>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <PasswordInput name="currentPassword" label="Current password" autoComplete="current-password" />
          <PasswordInput name="newPassword" label="New password" autoComplete="new-password" />
          <PasswordInput name="confirmation" label="Confirm new password" autoComplete="new-password" />
          {message ? (
            <p
              className={`text-sm ${success ? "text-emerald-700" : "text-destructive"}`}
              role="status"
            >
              {message}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Changing…" : "Change password"}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}

function PasswordInput({
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
        required
        autoComplete={autoComplete}
      />
    </label>
  );
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
