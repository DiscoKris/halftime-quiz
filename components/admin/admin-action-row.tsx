interface AdminActionRowProps {
  isSaving: boolean;
  submitLabel: string;
  onReset: () => void;
}

export function AdminActionRow({
  isSaving,
  submitLabel,
  onReset,
}: AdminActionRowProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-5">
      <button
        type="submit"
        disabled={isSaving}
        className="inline-flex h-10 items-center justify-center rounded-xl bg-emerald-400 px-4 text-sm font-semibold text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSaving ? "Saving..." : submitLabel}
      </button>
      <button
        type="button"
        onClick={onReset}
        disabled={isSaving}
        className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        Reset Form
      </button>
    </div>
  );
}
