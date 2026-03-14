import { AdminPageShell } from "../../../components/admin/admin-page-shell";
import { AdminPlaceholderPanel } from "../../../components/admin/admin-placeholder-panel";

export default function AdminLeaderboardsPage() {
  return (
    <AdminPageShell
      title="Leaderboards"
      description="This section will inspect cached leaderboard summary documents only. Public ranking must continue to read leaderboards/{eventId} and never aggregate raw quizResults in the client."
      badge="Cached Summaries"
    >
      <AdminPlaceholderPanel
        collectionName="leaderboards"
        serviceName="leaderboardsService"
        notes={[
          "Add summary inspection for topEntries, playerCount, lastUpdated, and version.",
          "Expose a trusted rebuild action that runs server-side or through Cloud Functions.",
          "Keep this page focused on cache health, not full raw result aggregation in the browser.",
        ]}
      />
    </AdminPageShell>
  );
}
