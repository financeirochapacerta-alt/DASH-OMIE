# Project Master

## Missão e estado

Construir uma aplicação gerencial moderna, segura e responsiva para a Chapa Certa. A Omie permanece operacional; PostgreSQL/Supabase será a fonte analítica; backend integra e aplica regras; frontend apresenta resultados tratados. Estado: **Etapa 1 concluída**. Próxima: banco/migrations.

## Arquitetura em uma linha

`Omie → API/Webhooks → RAW → NORMALIZED → BUSINESS/ANALYTICS → Backend → Frontend`

- Next.js + TypeScript + Tailwind CSS; PostgreSQL/Supabase e Supabase Auth.
- Secrets e chamadas Omie somente no backend.
- Cálculos financeiros críticos nunca na UI.
- Sincronização incremental por entidade, upsert, retry/backoff, logs e reconciliação; webhook entra em inbox bruta e não substitui reconciliação.

## Regras confirmadas essenciais

- Receber: `signed_value = +valor_documento`; pagar: `signed_value = -valor_documento`; preservar original.
- Cancelamento de pedido vem de `infoCadastro.cancelado` em `ConsultarPedido` e prevalece sobre etapa/faturamento.
- `data_previsao` não é automaticamente vencimento. Parcelas financeiras modelam múltiplos vencimentos; a primeira parcela foi referência histórica.
- Título vencido e aberto continua na projeção, trazido para hoje.
- Códigos/JSON Omie são preservados; mapeamentos de etapas são configuráveis.
- Janelas históricas iniciais: Pedido/OS desde 2025-01-01; financeiros desde 2025-01-01 até hoje + 1 ano.

## Prioridades

Custo inicial zero quando razoável; simplicidade; segurança; confiabilidade numérica; performance; UX desktop/mobile; manutenção.

## Navegação documental

- Arquitetura: `01-ARCHITECTURE.md`; Omie: `02-OMIE-INTEGRATION.md`; dados: `03-DATA-MODEL.md`
- Regras: `04-BUSINESS-RULES.md`; DRE: `05-DRE.md`; caixa: `06-CASH-FLOW.md`
- Indicadores: `07-INDICATORS.md`; sync: `08-SYNC-STRATEGY.md`; segurança: `09-SECURITY.md`
- Testes: `10-TESTING.md`; execução: `11-CODEX-RULES.md`; roadmap: `12-ROADMAP.md`
- Incertezas: `13-OPEN-QUESTIONS.md`; decisões: `DECISIONS.md`
