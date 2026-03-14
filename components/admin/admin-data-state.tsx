interface AdminDataStateProps {
  title: string;
  message: string;
}

export function AdminLoadingState({
  title,
  message,
}: AdminDataStateProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-5 text-sm text-white/70">
      <div className="font-medium text-white">{title}</div>
      <p className="mt-1">{message}</p>
    </div>
  );
}

export function AdminEmptyState({
  title,
  message,
}: AdminDataStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-white/15 bg-black/20 px-4 py-5 text-sm text-white/70">
      <div className="font-medium text-white">{title}</div>
      <p className="mt-1">{message}</p>
    </div>
  );
}

export function AdminErrorState({
  title,
  message,
}: AdminDataStateProps) {
  return (
    <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-5 text-sm text-red-100">
      <div className="font-medium">{title}</div>
      <p className="mt-1 text-red-100/85">{message}</p>
    </div>
  );
}
