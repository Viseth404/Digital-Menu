import { ConstructionIcon, MailIcon } from "lucide-react";

export function MaintenancePage({
  announcement,
  supportEmail,
}: {
  announcement: string | null;
  supportEmail: string;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-zinc-950 p-6 text-white">
      <section className="max-w-lg text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-white/10">
          <ConstructionIcon className="size-7" />
        </span>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
          Scheduled maintenance
        </p>
        <h1 className="mt-2 text-3xl font-semibold">
          Online ordering is temporarily unavailable
        </h1>
        <p className="mt-4 leading-7 text-white/60">
          {announcement ||
            "We are performing maintenance. Please ask restaurant staff for assistance."}
        </p>
        <a
          href={`mailto:${supportEmail}`}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-zinc-950"
        >
          <MailIcon className="size-4" /> Contact support
        </a>
      </section>
    </main>
  );
}
