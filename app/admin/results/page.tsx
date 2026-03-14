import { AdminPageShell } from "../../../components/admin/admin-page-shell";
import { AdminPlaceholderPanel } from "../../../components/admin/admin-placeholder-panel";

export default function AdminResultsPage() {
  return (
    <AdminPageShell
      title="Results"
      description="Raw result documents stay append-only and are intended for admin inspection, exports, and trusted leaderboard aggregation workflows."
      badge="Append-Only Results"
    >
      <AdminPlaceholderPanel
        collectionName="quizResults"
        serviceName="quizResultsService"
        notes={[
          "Filter by event, score, completion time, city, and ad-view metadata.",
          "Use this section for exports and audits instead of public ranking logic.",
          "Preserve one document per completed quiz and do not collapse writes into a hot shared leaderboard document.",
        ]}
      />
    </AdminPageShell>
  );
}
