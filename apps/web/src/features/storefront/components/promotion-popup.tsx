"use client";

import { useEffect, useRef, useState } from "react";
import { BadgePercentIcon, XIcon } from "lucide-react";
import { KhmerOrnament } from "@/features/storefront/components/khmer-ornament";
import {
  STOREFRONT_COPY,
  type StorefrontLanguage,
} from "@/features/storefront/constants";
import type { StorePromotion } from "@/features/storefront/types";
import { PROMOTION_RULES } from "@/features/stores/constants";

type PromotionPopupProps = {
  storeKey: string;
  storeName: string;
  promotion: StorePromotion | null;
  language: StorefrontLanguage;
};

export function PromotionPopup({
  storeKey,
  storeName,
  promotion,
  language,
}: PromotionPopupProps) {
  const copy = STOREFRONT_COPY[language];
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!promotion) return;
    const storageKey = `${PROMOTION_RULES.sessionStoragePrefix}:${storeKey}`;
    try {
      if (sessionStorage.getItem(storageKey)) return;
    } catch {
      // Storage can be unavailable in strict privacy modes. The popup still
      // works for the current page without persisting its viewed state.
    }

    const timer = window.setTimeout(() => {
      try {
        sessionStorage.setItem(storageKey, "shown");
      } catch {
        // See the privacy-mode note above.
      }
      setOpen(true);
    }, PROMOTION_RULES.displayDelayMs);
    return () => window.clearTimeout(timer);
  }, [promotion, storeKey]);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus();
    };
  }, [open]);

  if (!promotion || !open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center bg-[#0c2418]/70 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setOpen(false);
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="promotion-title"
        aria-describedby="promotion-message"
        className="promotion-enter relative w-full max-w-md overflow-hidden rounded-[2rem] border border-[#D4AF37]/40 bg-[#FFFDF8] shadow-[0_30px_100px_rgba(7,35,20,0.42)]"
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={() => setOpen(false)}
          aria-label={copy.closePromotion}
          className="absolute right-3 top-3 z-20 grid size-10 place-items-center rounded-full border border-white/30 bg-black/25 text-white backdrop-blur-md transition hover:rotate-6 hover:bg-black/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4AF37]"
        >
          <XIcon className="size-4" />
        </button>

        {promotion.imageUrl ? (
          <div className="relative aspect-[16/9] overflow-hidden bg-[#155D32]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={promotion.imageUrl}
              alt={`${storeName} promotion`}
              className="size-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#102c1d]/65 to-transparent" />
          </div>
        ) : (
          <div className="relative grid h-36 place-items-center overflow-hidden bg-[#155D32]">
            <KhmerOrnament
              size={112}
              className="size-28 rotate-12 object-contain opacity-30"
            />
            <BadgePercentIcon className="absolute size-10 text-[#f4d777]" />
          </div>
        )}

        <div className="relative p-6 text-center sm:p-8">
          <KhmerOrnament
            size={144}
            className="pointer-events-none absolute -bottom-14 -right-12 size-36 rotate-12 object-contain opacity-[0.06]"
          />
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.24em] text-[#2E7D32]">
            {copy.specialOffer} {storeName}
          </p>
          <h2
            id="promotion-title"
            className="mt-2 text-2xl font-bold tracking-tight text-[#1B1B1B] sm:text-3xl"
          >
            {promotion.title}
          </h2>
          <p
            id="promotion-message"
            className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#7A6A52] sm:text-base"
          >
            {promotion.message}
          </p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="relative mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[#155D32] px-6 text-sm font-bold text-white shadow-[0_8px_22px_rgba(21,93,50,0.25)] transition hover:-translate-y-0.5 hover:bg-[#2E7D32] hover:shadow-[0_12px_28px_rgba(21,93,50,0.32)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4AF37]"
          >
            {copy.exploreMenu}
          </button>
        </div>
      </section>
    </div>
  );
}
