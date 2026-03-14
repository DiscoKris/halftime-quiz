import { redirect } from "next/navigation";
import { ADMIN_ROUTES } from "../../../lib/constants";

export default function AdminQuizzesPage() {
  redirect(ADMIN_ROUTES.questions);
}
