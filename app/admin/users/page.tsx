import { AdminPageShell } from "../../../components/admin/admin-page-shell";
import { AdminPlaceholderPanel } from "../../../components/admin/admin-placeholder-panel";

export default function AdminUsersPage() {
  return (
    <AdminPageShell
      title="Users"
      description="User administration will read from the shared users collection and control role, paid state, and account status without introducing a parallel admin-only user store."
      badge="User Directory"
    >
      <AdminPlaceholderPanel
        collectionName="users"
        serviceName="usersService"
        notes={[
          "Search by email, username, or uid once the users table UI is added.",
          "Manage roles with the shared role model: user, admin, superadmin.",
          "Keep admin access checks aligned with users/{uid}.role rather than a separate adminUsers collection.",
        ]}
      />
    </AdminPageShell>
  );
}
