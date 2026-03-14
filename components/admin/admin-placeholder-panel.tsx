interface AdminPlaceholderPanelProps {
  collectionName: string;
  serviceName: string;
  notes: string[];
}

export function AdminPlaceholderPanel({
  collectionName,
  serviceName,
  notes,
}: AdminPlaceholderPanelProps) {
  return (
    <section className="grid gap-6 lg:grid-cols-[1.35fr_0.9fr]">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Current Status</h2>
        <p className="mt-2 text-sm text-white/70">
          This admin section is now a valid typed route and is ready to expand on top of the shared
          foundation layer.
        </p>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <dt className="text-xs uppercase tracking-[0.2em] text-white/45">Primary Collection</dt>
            <dd className="mt-2 text-sm font-medium text-white">{collectionName}</dd>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <dt className="text-xs uppercase tracking-[0.2em] text-white/45">Service Layer</dt>
            <dd className="mt-2 text-sm font-medium text-white">{serviceName}</dd>
          </div>
        </dl>
      </div>

      <aside className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Next Steps</h2>
        <ul className="mt-4 space-y-3 text-sm text-white/70">
          {notes.map((note) => (
            <li key={note} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
              {note}
            </li>
          ))}
        </ul>
      </aside>
    </section>
  );
}
