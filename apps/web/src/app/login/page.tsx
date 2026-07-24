import { LoginForm } from "@/features/auth/components/login-form";
import { Clock3Icon, ShieldCheckIcon, SparklesIcon } from "lucide-react";
import Link from "next/link";
import { appConfig } from "@/config/app-config";
import { KhmerOrnament } from "@/features/storefront/components/khmer-ornament";

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="relative flex overflow-hidden bg-[#F8F3E8] flex-col gap-4 p-6 md:p-10">
        <KhmerOrnament
          size={240}
          className="pointer-events-none absolute -bottom-16 -left-16 size-56 rotate-12 object-contain opacity-[0.07]"
        />
        <KhmerOrnament
          size={160}
          className="pointer-events-none absolute -right-12 top-1/4 size-36 -rotate-12 object-contain opacity-[0.05]"
        />
        <div className="relative z-10 flex justify-center gap-2 md:justify-start">
          <Link
            href={appConfig.routes.dashboard}
            className="group flex items-center gap-2.5 font-semibold text-[#155D32]"
          >
            <div className="flex size-9 items-center justify-center rounded-xl border border-[#D4AF37]/35 bg-[#FFFDF8] p-1 shadow-sm transition duration-300 group-hover:-translate-y-0.5 group-hover:shadow-md">
              <KhmerOrnament size={32} className="size-full object-contain" />
            </div>
            {appConfig.name}
          </Link>
        </div>
        <div className="relative z-10 flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm rounded-3xl border border-[#7A6A52]/15 bg-[#FFFDF8]/95 p-7 shadow-[0_22px_70px_rgba(79,58,25,0.1)] backdrop-blur sm:p-9">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-[#0d2b1b] text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-32 -top-32 size-96 rounded-full bg-[#D4AF37]/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-24 size-[28rem] rounded-full bg-[#2E7D32]/25 blur-3xl" />
        <KhmerOrnament
          size={620}
          className="pointer-events-none absolute -right-28 top-1/2 size-[32rem] -translate-y-1/2 rotate-12 object-contain opacity-[0.11]"
        />
        <div
          aria-hidden="true"
          className="khmer-pattern absolute inset-0 opacity-[0.035]"
        />
        <div className="relative z-10 flex items-center gap-2 p-10 text-sm text-zinc-300">
          <SparklesIcon className="size-4 text-amber-400" />
          One place for your entire restaurant
        </div>
        <div className="relative z-10 max-w-xl p-10 xl:p-16">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-amber-400">
            Restaurant operations, simplified
          </p>
          <h2 className="text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
            Keep every table, order, and shift moving.
          </h2>
          <p className="mt-5 max-w-lg text-base leading-7 text-zinc-400">
            See live service activity, coordinate your team, and make better
            decisions from a single dashboard.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <Clock3Icon className="mb-3 size-5 text-amber-400" />
              <p className="font-medium">Live operations</p>
              <p className="mt-1 text-sm text-zinc-400">
                Orders and tables at a glance
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <ShieldCheckIcon className="mb-3 size-5 text-amber-400" />
              <p className="font-medium">Secure access</p>
              <p className="mt-1 text-sm text-zinc-400">
                Built for your whole team
              </p>
            </div>
          </div>
        </div>
        <p className="relative z-10 p-10 text-xs text-zinc-600">
          © {appConfig.copyrightYear} {appConfig.name}
        </p>
      </div>
    </div>
  );
}
