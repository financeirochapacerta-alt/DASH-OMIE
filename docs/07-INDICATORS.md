# Indicadores planejados

Todos os indicadores devem declarar definição, filtros, granularidade, timezone, fonte, atualização e regra de cancelamento antes de serem publicados.

- Executivo: faturamento, meta/atingimento, carteira, a faturar, receber, vencidos, pagar, saldo, projeção, resultado e alertas.
- Financeiro: receber/pagar, vencidos/hoje, inadimplência, evolução mensal, top despesas e heatmap.
- Comercial: pedidos, OS, funil, vendedores, ticket, faturado vs. a faturar, ranking e ABC de clientes.
- DRE: mensal, acumulado, comparativos e drill-down.
- Caixa: diário/acumulado, projeção, mínimo e alertas.

Metas, inadimplência, carteira, resultado e Curva ABC precisam de definições formais antes da implementação.

O núcleo comercial entrega total, quantidade, ticket médio, faturado/a faturar, ranking por vendedor/cliente, pipeline e ABC. A ABC atual ordena faturamento elegível decrescente (cliente como desempate), usa percentuais cumulativos A até 80%, B até 95% e C acima disso. É uma definição técnica inicial, a validar com o negócio.

DRE gerencial informa valores mensais/acumulados por toda a hierarquia e cobertura de mapping. Caixa informa posição por conta/consolidada, realizado, projeção diária, entradas, saídas, primeiro saldo negativo, primeiro saldo abaixo do mínimo, vencidos acumulados e concentração diária de pagamentos.

## Mapeamento auditável — KPI → fonte

Todo KPI crítico é lido de uma view/RPC analítica; nenhum é recalculado no frontend. Fonte de verdade: `src/features/management/data.ts`, `admin-insights.ts` e `users.ts`.

| KPI (Dashboard Executivo) | Fonte |
|---|---|
| Vendas (comercial) | `analytics.sales_summary.total_value` |
| Faturado | `analytics.sales_summary.invoiced_value` |
| A faturar | `analytics.sales_summary.to_invoice_value` |
| A receber | soma de `analytics.open_receivables.signed_value` |
| Vencido (total) | soma de `analytics.overdue_receivables` + `analytics.overdue_payables` |
| A pagar | soma de `analytics.open_payables.signed_value` |
| Saldo atual | `analytics.cash_current_balance.current_balance` |
| Projeção de caixa | último `analytics.cash_projection_daily.closing_balance` do horizonte |
| Caixa fica crítico em | `analytics.cash_projection_summary.first_negative_cash_date` |
| Resultado gerencial (mês) | `analytics.dre_monthly.amount`, filtrado ao mês corrente |
| Melhor vendedor | `analytics.sales_by_seller`, maior `total_value` |
| Alertas | `generateManagementAlerts()` (`src/features/management/rules.ts`) sobre sinais das views acima |

| KPI (Financeiro/Fluxo/DRE/Comercial) | Fonte |
|---|---|
| Recebíveis/pagáveis vencidos | `analytics.overdue_receivables` / `analytics.overdue_payables` |
| Movimentos financeiros (tabela) | `analytics.financial_movements` (com `customer_name`/`category_name` desde `20260821190000`) |
| Entradas x saídas realizadas | `analytics.cash_realized_monthly` |
| Saldo por conta | `analytics.cash_account_balances` |
| Entradas/saídas previstas, concentração | `analytics.cash_projection_summary` |
| Projeção diária | `analytics.cash_projection_daily` |
| Hierarquia DRE + origem (Omie/manual/unmapped) | `analytics.dre_monthly` (`mapping_source` desde `20260821200000`) |
| Funil comercial | `analytics.sales_pipeline` |
| Ranking de vendedores | `analytics.sales_by_seller` |
| Curva ABC | `analytics.customer_abc` |
| Pedidos/OS recentes | `analytics.sales` |

| KPI (Administração) | Fonte |
|---|---|
| Categorias DRE unmapped, pedidos sem parcelas/real_due_date/vendedor, status financeiro desconhecido | `getDataQualitySummary()` sobre `public.sales_orders`/`service_orders`/`sales_order_installments`/`accounts_receivable`/`accounts_payable` e `analytics.dre_monthly` |
| Status de sincronização, locks ativos | RPCs `admin_sync_status()`/`admin_active_locks()` sobre `raw.sync_runs`/`raw.sync_locks` (raw não é exposto pela Data API — ADR-007) |
| Usuários, role, ativo/inativo | `public.profiles` via `listUsers()` |

## Experiência gerencial

A primeira experiência apresenta Visão Geral, Financeiro, Caixa, DRE, Comercial e Alertas com filtros de período compartilhados. Metas usam percentual, faltante, necessidade por dia útil e ritmo esperado versus realizado. Inadimplência é indicador gerencial `vencidos / abertos`, nunca índice contábil oficial. Alertas são determinísticos, priorizados e separados de qualidade de dados.
