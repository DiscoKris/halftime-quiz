import { AdminPageShell } from "../../../components/admin/admin-page-shell";
import { AdminPlaceholderPanel } from "../../../components/admin/admin-placeholder-panel";

export default function AdminSettingsPage() {
  return (
    <AdminPageShell
      title="Settings"
      description="Admin settings will hold operational flags and future trusted controls for event activation, leaderboard rebuilds, and app-wide defaults."
      badge="Operations"
    >
      <AdminPlaceholderPanel
        collectionName="adminSettings"
        serviceName="admin settings + server workflows"
        notes={[
          "Store operational flags here instead of scattering config across route files.",
          "Add controls for trusted maintenance actions such as cache rebuilds and snapshot refreshes.",
          "Keep any server-only secrets out of this collection and out of NEXT_PUBLIC environment variables.",
        ]}
      />
    </AdminPageShell>
  );
}
