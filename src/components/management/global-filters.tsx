export function GlobalFilters({ commercial = false }: { commercial?: boolean }) {
  return <form className="filter-bar" aria-label="Filtros do relatório">
    <label><span>Período</span><select name="period" defaultValue="month"><option value="month">Este mês</option><option value="previous">Mês anterior</option><option value="3m">Últimos 3 meses</option><option value="6m">Últimos 6 meses</option><option value="year">Este ano</option><option value="custom">Personalizado</option></select></label>
    {commercial && <><label><span>Vendedor</span><select name="seller" defaultValue=""><option value="">Todos</option></select></label><label><span>Cliente</span><select name="customer" defaultValue=""><option value="">Todos</option></select></label></>}
    <button className="filter-button">Aplicar filtros</button>
  </form>;
}
