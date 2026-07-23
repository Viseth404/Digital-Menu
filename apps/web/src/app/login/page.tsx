import { LoginForm } from "@/features/auth/components/login-form";
import {
  ChefHatIcon,
  Clock3Icon,
  ShieldCheckIcon,
  SparklesIcon,
} from "lucide-react";
import Link from "next/link";
import { appConfig } from "@/config/app-config";

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link
            href={appConfig.routes.dashboard}
            className="flex items-center gap-2 font-medium"
          >
            <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <ChefHatIcon className="size-4" />
            </div>
            {appConfig.name}
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-zinc-950 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-32 -top-32 size-96 rounded-full bg-amber-500/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-24 size-[28rem] rounded-full bg-orange-700/20 blur-3xl" />
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
