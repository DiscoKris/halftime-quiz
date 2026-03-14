import Link from "next/link";
import type { ReactNode } from "react";

interface AdminPageShellProps {
  title: string;
  description: string;
  badge?: string;
  children?: ReactNode;
}

export function AdminPageShell({
  title,
  description,
  badge,
  children,
}: AdminPageShellProps) {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <header className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            {badge ? (
              <span className="inline-flex rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-emerald-300">
                {badge}
              </span>
            ) : null}
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
              <p className="mt-2 max-w-3xl text-sm text-white/70">{description}</p>
            </div>
          </div>

          <Link
            href="/admin"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            Back to Dashboard
          </Link>
        </header>

        {children}
      </div>
    </main>
  );
}
