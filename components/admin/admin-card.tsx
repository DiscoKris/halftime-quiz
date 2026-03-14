import type { ReactNode } from "react";

interface AdminCardProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function AdminCard({
  title,
  description,
  actions,
  children,
}: AdminCardProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="mb-5 flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-white/65">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}
