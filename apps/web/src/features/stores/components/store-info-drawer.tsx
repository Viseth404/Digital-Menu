"use client";

import type React from "react";
import {
  ExternalLinkIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
} from "lucide-react";
import { KhmerOrnament } from "@/features/storefront/components/khmer-ornament";
import {
  STOREFRONT_COPY,
  type StorefrontLanguage,
} from "@/features/storefront/constants";
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
  language: StorefrontLanguage;
};

export function StoreInfoDrawer({
  name,
  description,
  address,
  phone,
  email,
  currency,
  socialLinks,
  language,
}: StoreInfoDrawerProps) {
  const copy = STOREFRONT_COPY[language];
  return (
    <Sheet>
      <SheetTrigger className="group/info inline-flex h-12 items-center gap-2 rounded-2xl border border-[#7A6A52]/20 bg-[var(--menu-card)] px-3 text-sm font-semibold text-[var(--menu-text)] shadow-[0_8px_28px_rgba(92,69,31,0.07)] transition duration-300 hover:-translate-y-0.5 hover:border-[#D4AF37]/70 hover:shadow-[0_12px_30px_rgba(92,69,31,0.11)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4AF37] sm:px-4">
        <KhmerOrnament
          size={24}
          className="size-5 object-contain drop-shadow-sm transition duration-500 group-hover/info:rotate-12 group-hover/info:scale-110"
        />
        <span className="hidden sm:inline">{copy.storeInfo}</span>
      </SheetTrigger>
      <SheetContent className="w-[90vw] gap-0 bg-white sm:max-w-md">
        <SheetHeader className="relative overflow-hidden border-b bg-[#F8F3E8] p-6 pr-12">
          <KhmerOrnament
            size={180}
            className="pointer-events-none absolute -bottom-14 -right-10 size-40 rotate-12 object-contain opacity-[0.08]"
          />
          <div className="group/mark relative mb-4 flex size-12 items-center justify-center rounded-2xl border border-[#D4AF37]/30 bg-[#FFFDF8] p-1.5 shadow-sm">
            <KhmerOrnament
              size={42}
              className="size-full object-contain drop-shadow-sm transition duration-500 group-hover/mark:rotate-6 group-hover/mark:scale-110"
            />
          </div>
          <SheetTitle className="relative text-2xl font-bold text-[#1B1B1B]">
            {name}
          </SheetTitle>
          <SheetDescription className="relative text-[#7A6A52]">
            {description ?? copy.storeInfoFallback}
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
              {copy.followUs}
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
          {copy.pricesDisplayedIn} {currency}.
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
