import { AdminPageShell } from "../../../../components/admin/admin-page-shell";
import { AdminPlaceholderPanel } from "../../../../components/admin/admin-placeholder-panel";

interface AdminQuizDetailPageProps {
  params: Promise<{
    quizId: string;
  }>;
}

export default async function AdminQuizDetailPage({
  params,
}: AdminQuizDetailPageProps) {
  const { quizId } = await params;

  return (
    <AdminPageShell
      title={`Quiz Detail: ${quizId}`}
      description="This legacy quiz detail route remains valid while question management is migrated onto the sports-first question pool model."
      badge="Legacy Detail Route"
    >
      <AdminPlaceholderPanel
        collectionName="questions"
        serviceName="questionsService"
        notes={[
          `Use this route to map older quiz-specific links onto the shared question management flow for ${quizId}.`,
          "Replace quiz-centric assumptions with team, league, and sport source pools.",
          "Route future edits through the question service layer rather than embedding Firestore logic in the page.",
        ]}
      />
    </AdminPageShell>
  );
}
