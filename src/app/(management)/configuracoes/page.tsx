import { PageHeading } from "@/components/management/dashboard-ui"; import { requireManagementAccess } from "@/features/management/access"; import { listBankAccountsForReconciliation, updateBankAccountSelection } from "@/features/management/bank-accounts"; import { formatBRL, formatDate } from "@/features/management/format"; import { updateManagementSettings } from "@/features/management/settings-actions";

export default async function SettingsPage(){
  await requireManagementAccess("configuration");
  const accounts = await listBankAccountsForReconciliation();
  const selectedCount = accounts.filter((account) => account.selectedForCash && !account.blocked && !account.inactive).length;
  return <>
    <PageHeading eyebrow="Configurações" title="Parâmetros gerenciais" description="Regras explícitas, tipadas e protegidas para a experiência executiva"/>
    <form className="settings-grid" action={updateManagementSettings}><label><span>Meta mensal (R$)</span><input name="monthly_revenue_goal" type="number" min="0" step="0.01" defaultValue="0"/></label><label><span>Caixa mínimo (R$)</span><input name="minimum_cash" type="number" min="0" step="0.01" defaultValue="0"/></label><label><span>Dias de projeção</span><input name="cash_projection_days" type="number" min="1" step="1" defaultValue="30"/></label><label><span>Concentração máxima por cliente (%)</span><input name="customer_concentration_threshold" type="number" min="0" max="100" step="0.1" defaultValue="30"/></label><button className="primary-button">Salvar parâmetros</button></form>
    <section className="panel settings-section">
      <div className="panel-title">
        <div><h2>Contas consideradas nos relatórios</h2><p>Contas desmarcadas continuam sincronizadas e auditáveis, mas não entram no saldo consolidado nem nos relatórios de caixa. Sincronização com a Omie nunca altera esta escolha.</p></div>
        <span className="status-badge">{selectedCount} de {accounts.length} contas consideradas</span>
      </div>
      <div className="table-scroll">
        <table>
          <thead><tr><th>Considerar</th><th>Conta</th><th>Status Omie</th><th>Saldo do sistema</th><th>Base/Data</th><th>Observação</th></tr></thead>
          <tbody>
            {accounts.map((account) => {
              const excludedByStatus = account.blocked || account.inactive;
              return (
                <tr key={account.id}>
                  <td>
                    <form action={updateBankAccountSelection} className="inline-form">
                      <input type="hidden" name="bank_account_id" value={account.id} />
                      <input type="hidden" name="selected_for_cash" value={String(!account.selectedForCash)} />
                      <input type="checkbox" checked={account.selectedForCash} disabled readOnly aria-label={`${account.description} considerada nos relatórios`} />
                      <button className="secondary-button small" disabled={excludedByStatus}>{account.selectedForCash ? "Excluir dos relatórios" : "Incluir nos relatórios"}</button>
                    </form>
                  </td>
                  <td>{account.description}</td>
                  <td>
                    {account.blocked && <span className="status-badge warning">Bloqueada</span>}
                    {account.inactive && <span className="status-badge warning">Inativa</span>}
                    {!account.blocked && !account.inactive && <span className="status-badge">Ativa</span>}
                  </td>
                  <td>{formatBRL(account.computedBalance)}</td>
                  <td>{account.balanceDate ? formatDate(account.balanceDate) : "Sem data-base (todo o histórico é considerado)"}</td>
                  <td>{excludedByStatus ? "Bloqueada/inativa — não entra no saldo, independente da seleção" : !account.selectedForCash ? "Fora do saldo consolidado por escolha do ADMIN" : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
    <section className="panel settings-section"><div className="panel-title"><div><h2>Mapeamentos</h2><p>Códigos Omie são preservados em todas as alterações</p></div></div><div className="settings-links"><button>Etapas de Pedidos e OS</button><button>Categorias da DRE</button></div></section>
  </>;
}
