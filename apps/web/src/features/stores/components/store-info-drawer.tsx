"use client";

import type React from "react";
import {
  ExternalLinkIcon,
  InfoIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  StoreIcon,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type StoreInfoDrawerProps = {
  name: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  currency: string;
  socialLinks: Array<[string, string]>;
};

export function StoreInfoDrawer({
  name,
  description,
  address,
  phone,
  email,
  currency,
  socialLinks,
}: StoreInfoDrawerProps) {
  return (
    <Sheet>
      <SheetTrigger className="inline-flex h-11 items-center gap-2 rounded-xl border border-black/10 bg-white px-3 text-sm font-semibold text-zinc-700 shadow-sm transition hover:border-[var(--store-primary)] sm:px-4">
        <InfoIcon className="size-4 text-[var(--store-primary)]" />
        <span className="hidden sm:inline">Store info</span>
      </SheetTrigger>
      <SheetContent className="w-[90vw] gap-0 bg-white sm:max-w-md">
        <SheetHeader className="border-b bg-[var(--store-accent)] p-6 pr-12">
          <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-[var(--store-primary)] text-[var(--store-on-primary)]">
            <StoreIcon className="size-5" />
          </div>
          <SheetTitle className="text-2xl font-bold">
            {name}
          </SheetTitle>
          <SheetDescription>
            {description ?? "Everything you need to know about this store."}
          </SheetDescription>
        </SheetHeader>

        <div className="grid gap-3 p-6">
          {address ? <InfoRow icon={MapPinIcon}>{address}</InfoRow> : null}
          {phone ? (
            <InfoRow icon={PhoneIcon} href={`tel:${phone}`}>
              {phone}
            </InfoRow>
          ) : null}
          {email ? (
            <InfoRow icon={MailIcon} href={`mailto:${email}`}>
              {email}
            </InfoRow>
          ) : null}
        </div>

        {socialLinks.length ? (
          <div className="border-t p-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Follow us
            </p>
            <div className="flex flex-wrap gap-2">
              {socialLinks.map(([label, href]) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-medium transition hover:bg-muted"
                >
                  {label} <ExternalLinkIcon className="size-3" />
                </a>
              ))}
            </div>
          </div>
        ) : null}

        <p className="mt-auto border-t bg-zinc-50 p-6 text-xs text-muted-foreground">
          All storefront prices are displayed in {currency}.
        </p>
      </SheetContent>
    </Sheet>
  );
}

function InfoRow({
  icon: Icon,
  href,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  children: React.ReactNode;
}) {
  const content = (
    <>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 break-words">{children}</span>
    </>
  );
  return href ? (
    <a
      href={href}
      className="flex items-center gap-3 rounded-xl border p-3 text-sm transition hover:bg-muted/50"
    >
      {content}
    </a>
  ) : (
    <div className="flex items-center gap-3 rounded-xl border p-3 text-sm">
      {content}
    </div>
  );
}
