import { PageHeading } from "@/components/management/dashboard-ui";
import { requireManagementAccess } from "@/features/management/access";
import { formatDate } from "@/features/management/format";
import { listUsers, MANAGED_ROLES, toggleUserActive, updateUserRole } from "@/features/management/users";

export default async function UsersPage() {
  const auth = await requireManagementAccess("profiles");
  const users = await listUsers();

  return (
    <>
      <PageHeading eyebrow="Administração" title="Usuários e permissões" description="Role e status ativo/inativo — alteração é server-side, exige ADMIN e respeita RLS" />
      <section className="panel table-panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr><th>Usuário</th><th>Role</th><th>Status</th><th>Criado em</th><th>Ações</th></tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.fullName ?? user.id.slice(0, 8)}</td>
                  <td>
                    <form action={updateUserRole} className="inline-form">
                      <input type="hidden" name="userId" value={user.id} />
                      <select name="role" defaultValue={user.role} disabled={user.id === auth.userId}>
                        {MANAGED_ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
                      </select>
                      <button className="secondary-button small" disabled={user.id === auth.userId}>Salvar</button>
                    </form>
                  </td>
                  <td>
                    <span className={`status-badge ${user.isActive ? "" : "warning"}`}>{user.isActive ? "Ativo" : "Inativo"}</span>
                  </td>
                  <td>{formatDate(user.createdAt.slice(0, 10))}</td>
                  <td>
                    <form action={toggleUserActive}>
                      <input type="hidden" name="userId" value={user.id} />
                      <input type="hidden" name="active" value={String(!user.isActive)} />
                      <button className="secondary-button small" disabled={user.id === auth.userId}>{user.isActive ? "Desativar" : "Ativar"}</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
