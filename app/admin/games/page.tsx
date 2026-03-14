import { AdminPageShell } from "../../../components/admin/admin-page-shell";
import { AdminPlaceholderPanel } from "../../../components/admin/admin-placeholder-panel";

export default function AdminGamesPage() {
  return (
    <AdminPageShell
      title="Games"
      description="This compatibility route maps onto the new events architecture. In the next phase, this page should either redirect to /admin/events or become a thin wrapper around event management."
      badge="Compatibility Route"
    >
      <AdminPlaceholderPanel
        collectionName="events"
        serviceName="eventsService"
        notes={[
          "Replace legacy game terminology with event-centric CRUD while keeping old links stable.",
          "Wire kickoff time, halftime offset, quiz window, and ad assignment into the event form.",
          "Trigger frozen eventQuestions snapshot generation from this section when an event is activated.",
        ]}
      />
    </AdminPageShell>
  );
}
