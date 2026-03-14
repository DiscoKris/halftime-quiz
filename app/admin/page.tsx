import Link from "next/link";
import { AdminPageShell } from "../../components/admin/admin-page-shell";
import { ADMIN_ROUTES } from "../../lib/constants";

const cards = [
  {
    title: "Sports",
    desc: "Set sport taxonomy and default halftime timing values.",
    href: ADMIN_ROUTES.sports,
  },
  {
    title: "Leagues",
    desc: "Manage leagues and keep them tied to the correct sport.",
    href: ADMIN_ROUTES.leagues,
  },
  {
    title: "Teams",
    desc: "Create teams with sport and league relationships for event scheduling.",
    href: ADMIN_ROUTES.teams,
  },
  {
    title: "Stadiums",
    desc: "Manage venues, geo data, and sport or league associations.",
    href: ADMIN_ROUTES.stadiums,
  },
  {
    title: "Events",
    desc: "Create and manage sports events, quiz windows, and readiness flags.",
    href: ADMIN_ROUTES.events,
  },
  {
    title: "Users",
    desc: "Inspect player profiles, roles, paid state, and support future admin access workflows.",
    href: ADMIN_ROUTES.users,
  },
  {
    title: "Results",
    desc: "Review append-only quiz completion documents without turning the public leaderboard into a raw-results query.",
    href: ADMIN_ROUTES.results,
  },
  {
    title: "Leaderboards",
    desc: "Inspect the cached leaderboard summary documents that public clients should read instead of aggregating live.",
    href: ADMIN_ROUTES.leaderboards,
  },
  {
    title: "Questions",
    desc: "Manage reusable master question pools and bulk imports for event snapshot generation.",
    href: ADMIN_ROUTES.questions,
  },
  {
    title: "Settings",
    desc: "Manage admin-level operational settings and the next server-controlled workflows.",
    href: ADMIN_ROUTES.settings,
  },
] as const;

export default function AdminDashboardPage() {
  return (
    <AdminPageShell
      title="Admin Dashboard"
      description="This scaffold now sits on the shared sports-first architecture layer. The next phases can extend these sections without mixing Firestore logic directly into route components."
      badge="MyHalftimeQuiz Admin"
    >
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="flex flex-col rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
          >
            <div className="text-lg font-semibold">{card.title}</div>
            <p className="mt-2 flex-1 text-sm text-white/70">{card.desc}</p>
            <span className="mt-5 text-sm font-medium text-emerald-300">Open section</span>
          </Link>
        ))}
      </section>
    </AdminPageShell>
  );
}
