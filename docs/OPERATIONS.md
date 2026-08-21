# Operação

Guia prático para tarefas recorrentes. Para arquitetura e decisões, ver `docs/00-PROJECT-MASTER.md` e `docs/DECISIONS.md`.

## Como executar cada onda de sincronização

Todas exigem `.env.local` preenchido localmente (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `OMIE_APP_KEY`, `OMIE_APP_SECRET`) e são idempotentes (hash-based upsert) — rodar de novo não duplica nem corrompe dados.

```bash
npm run sync:onda1          # Clientes, Vendedores, Categorias, Contas Correntes
npm run sync:onda2          # Contas a Receber, Contas a Pagar
npm run sync:onda3-pedidos  # Pedidos e Ordens de Serviço (cancelamento/parcelas já vêm da listagem — ADR-019)
npm run sync:dre-mappings   # Popula dre_category_mappings a partir do dadosDRE da Omie
```

Enriquecimento pontual de um pedido (diagnóstico/reconciliação, não faz parte do fluxo normal — ver `scripts/enrich-onda3-sample.ts` como referência de uso do módulo `ConsultarPedido`).

## Como verificar o estado da sincronização

Via UI: `/administracao` (ADMIN/DIRETORIA) mostra a última execução por entidade, contagens (fetched/inserted/updated/unchanged/failed) e locks ativos.

Via SQL direto (Management API, não expõe secrets):

```bash
npx supabase db query --linked "select entity_type, status, started_at, finished_at, records_failed from raw.sync_runs order by started_at desc limit 20;"
npx supabase db query --linked "select * from raw.sync_locks;"
npx supabase db query --linked "select entity_type, omie_id, error_message from raw.sync_errors order by occurred_at desc limit 20;"
```

## Como investigar uma falha de sincronização

1. `raw.sync_errors` tem a mensagem exata por `omie_id` e `entity_type`.
2. `raw.omie_records` guarda o payload bruto recebido — confirme se o campo esperado realmente existe na resposta real antes de assumir bug de código (ver ADR-019 e os achados de payload desta etapa: `ConsultarPedido` embrulha em `pedido_venda_produto`, `ListarContasCorrentes` usa a própria chamada como chave do array).
3. Nunca modifique uma migration já aplicada para "corrigir" algo — crie uma nova migration `create or replace view`/`alter table` (append-only).

## Locks

Se uma sincronização for interrompida à força (kill do processo, não o fluxo normal try/finally), o lock em `raw.sync_locks` pode ficar preso até expirar (TTL padrão 30 min). Para liberar manualmente antes disso:

```bash
npx supabase db query --linked "select public.operational_release_sync_lock('sales_orders');"
```

Use apenas quando tiver certeza de que não há sincronização real em andamento para aquela entidade.

## Migrations

```bash
npx supabase migration list          # comparar local vs remoto
npx supabase db push --dry-run       # revisar antes de aplicar
npx supabase db push --yes           # aplicar
npx supabase db advisors --linked --type security   # auditoria pós-migration
npx supabase gen types typescript --linked > src/types/database.ts   # regenerar tipos
```

## Promover um usuário a ADMIN (primeiro ADMIN / recuperação)

Cadastro público está desabilitado; todo novo usuário nasce `VIEWER` inativo (ADR-009). Após criar o usuário via Supabase Dashboard → Authentication → Users:

```bash
npx supabase db query --linked "update public.profiles set role='ADMIN', is_active=true where id='<uuid-do-usuario>';"
```

Depois do primeiro ADMIN existir, use `/usuarios` na aplicação — a alteração de role/status é Server Action ADMIN-only, sem precisar de SQL manual.

## Verificar RLS

```bash
npx supabase db query --linked "select tablename, rowsecurity from pg_tables where schemaname in ('public','raw') order by 1;"
npx supabase db query --linked "select schemaname, count(*) from pg_policies group by 1;"
```

## Atualizar `.env.local`

Nunca colar valores no chat/PR. Copiar `.env.example`, preencher localmente. `SUPABASE_SERVICE_ROLE_KEY`/`OMIE_APP_KEY`/`OMIE_APP_SECRET` só são necessárias para rodar os scripts de sincronização — a aplicação web em si só precisa das duas variáveis `NEXT_PUBLIC_*`.

## NÃO FAZER

- `supabase db reset` remoto.
- `supabase migration repair` sem investigar a causa raiz primeiro.
- Usar um projeto Supabase pessoal/de outro sistema.
- Expor `SUPABASE_SERVICE_ROLE_KEY` ou `OMIE_APP_SECRET` fora de módulos `server-only` — nunca em Client Component, rota pública ou log.
- Apagar dados de `raw.*` sem planejamento (é o único registro do payload bruto recebido).
- Vincular Pedido/OS a título financeiro por heurística — nenhuma chave confiável foi encontrada (ver `13-OPEN-QUESTIONS.md`); domínios ficam separados até haver evidência explícita.
- Editar uma migration já aplicada ao remoto — sempre criar uma nova, append-only.
- Usar `git push --force` no `origin/master` oficial.
