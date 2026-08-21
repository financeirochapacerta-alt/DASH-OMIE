# Produção

Runbook de produção. Para desenvolvimento local, ver [`README.md`](../README.md); para operação recorrente (ondas de sync, locks, migrations), ver [`OPERATIONS.md`](OPERATIONS.md). Sem segredos neste arquivo.

## URL de produção

`<preencher após o deploy — ver "Deploy" abaixo>`

## Hospedagem

**Vercel (plano Free)**. Justificativa: é o runtime de referência para Next.js 16 (App Router, Server Components, Server Actions) sem configuração extra, e o plano Free cobre o uso esperado desta aplicação (uma equipe pequena, tráfego baixo). Supabase permanece o único backend/banco — a Vercel só hospeda o frontend/Server Actions.

## Deploy

1. No dashboard da Vercel: **Add New → Project → Import Git Repository** e selecionar `financeirochapacerta-alt/DASH-OMIE`. A Vercel detecta Next.js automaticamente (build `next build`, output padrão) — não é necessário `vercel.json`.
2. Antes do primeiro deploy, configurar as variáveis de ambiente (ver seção seguinte) no projeto Vercel para o ambiente **Production**.
3. Deploy inicial roda automaticamente após o import. Deploys seguintes acontecem a cada push em `origin/master` (integração Git nativa da Vercel — nenhum passo manual).
4. **Nunca** usar `.env.local` como arquivo de deploy — ele é local/gitignored; as variáveis vivem exclusivamente na configuração do projeto na Vercel.

## Variáveis de produção

Configurar em Vercel → Project → Settings → Environment Variables → **Production**.

Públicas (expostas ao browser via prefixo `NEXT_PUBLIC_`, não são segredo):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Privadas (nunca prefixadas com `NEXT_PUBLIC_`, nunca lidas por Client Component):
- `SUPABASE_SERVICE_ROLE_KEY` — **não é usada pela aplicação web em nenhuma rota/Server Action** (todo acesso do frontend passa pelo cliente autenticado + RLS). Só é necessária se algum job de sincronização vier a rodar dentro da própria Vercel; hoje a sincronização roda via GitHub Actions (ver abaixo), então **não é necessário configurar esta variável na Vercel** a menos que isso mude.
- `OMIE_APP_KEY` / `OMIE_APP_SECRET` — mesma observação: só necessárias onde os scripts de sync rodam (GitHub Actions), não na Vercel.

Credenciais `E2E_<ROLE>_EMAIL`/`E2E_<ROLE>_PASSWORD` são exclusivamente para desenvolvimento local — nunca configurar em produção.

## Auth URLs (Supabase)

Após a URL de produção existir, em Supabase → Authentication → URL Configuration:
- **Site URL**: `https://<url-de-producao>`
- **Redirect URLs**: adicionar `https://<url-de-producao>/**`, mantendo `http://localhost:3000/**` para desenvolvimento continuar funcionando.

Validar login real na URL de produção antes de considerar o go-live concluído.

## Primeiro smoke test (produção)

Com o usuário ADMIN real, validar apenas (sem alterar dados financeiros): login, logout, e que cada área carrega sem erro — Dashboard, Financeiro, Fluxo de Caixa, DRE, Comercial, Alertas, Administração, Usuários.

## Sincronização em produção

Sem scheduler dentro da Vercel (funções serverless da Vercel têm timeout incompatível com syncs que levam 30–70 min no volume atual — ver `08-SYNC-STRATEGY.md`). Mecanismo escolhido: **GitHub Actions** (`.github/workflows/sync-omie.yml`), sem custo (repositório público = minutos ilimitados).

Nenhum endpoint Omie tem incremental confirmado hoje — toda sincronização é full listing + reconciliação (estratégia já documentada, não alterada aqui). Frequência inicial, conservadora e revisável com uso real:

| Onda | Conteúdo | Frequência | Horário (BRT) |
|---|---|---|---|
| onda1 | Clientes, Vendedores, Categorias, Contas Correntes | 1x/dia | 06:00 |
| onda2 | Contas a Receber, Contas a Pagar | 4x/dia | 08h, 12h, 16h, 20h |
| onda3-pedidos | Pedidos e Ordens de Serviço | 3x/dia | 09h, 13h, 18h |

`sync:dre-mappings` não entrou no agendamento automático — é um backfill de classificação, não um sync de dados transacionais; continua manual sob demanda (ver `OPERATIONS.md`).

### Ativação (ação necessária do usuário)

O workflow já está no repositório mas **não roda até os secrets existirem**. Em GitHub → repositório → Settings → Secrets and variables → Actions, adicionar (mesmos 5 nomes/valores já usados localmente em `.env.local`):
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `OMIE_APP_KEY`, `OMIE_APP_SECRET`.

Depois, testar manualmente via aba **Actions → Sync Omie → Run workflow** (escolher uma onda) antes de confiar no agendamento automático.

## Execução automática — por que GitHub Actions

Critérios do bloco de go-live: sem custo, secrets protegidos, timeout compatível, logs, lock lógico, retry controlado.

- **Custo**: repositório público → minutos de Actions ilimitados no plano Free do GitHub.
- **Timeout**: job configurado com `timeout-minutes: 120`; runners hospedados permitem até 6h — folga real acima dos 30–70 min medidos.
- **Secrets**: GitHub Actions Secrets (criptografados, mascarados em log, nunca aparecem no código/Git).
- **Logs**: aba Actions do repositório mostra cada execução, com stdout/stderr completos.
- **Lock lógico**: dupla camada — (1) cada script já adquire/libera lock por entidade em `raw.sync_locks` via `operational_acquire_sync_lock`/`operational_release_sync_lock` (mecanismo pré-existente, não alterado aqui); (2) o workflow usa `concurrency: group: sync-omie` para nunca permitir duas execuções do workflow (agendada ou manual) simultâneas, mesmo que o disparo venha de gatilhos diferentes.
- **Retry**: o cliente Omie já faz retry com backoff exponencial para 429/5xx/timeout (ver `08-SYNC-STRATEGY.md`); o workflow em si não faz retry automático de falha total — uma falha fica visível em Actions + no próprio `raw.sync_runs`/`/administracao` para reprocessar manualmente via `workflow_dispatch`.
- Vercel Cron foi descartado: funções serverless da Vercel não comportam uma sincronização de dezenas de minutos.

## Não duplicar sync

`raw.sync_locks` (com TTL) impede que cron, disparo manual (`workflow_dispatch`) e qualquer outra execução rodem simultaneamente para a mesma entidade — isso já valia antes deste bloco e continua sem alteração. O `concurrency` do workflow acrescenta uma segunda barreira no nível do próprio agendador.

## Observabilidade

Sem stack nova/paga. Usar o que já existe:
- `/administracao` (ADMIN/DIRETORIA): última execução por entidade, status, duração, fetched/inserted/updated/unchanged/failed, locks ativos.
- `raw.sync_runs`, `raw.sync_entity_state`, `raw.sync_errors`, `raw.sync_locks` — consultáveis via `npx supabase db query --linked` (ver comandos em `OPERATIONS.md`).
- Aba **Actions** do GitHub — log completo de cada execução agendada/manual.

## Alertas operacionais

Sem custo adicional: o GitHub já envia e-mail automaticamente para quem editou o workflow quando uma execução agendada falha — não requer configuração extra. Isso cobre "falha de sync" sem infraestrutura nova. Um alerta mais rico (Slack, PagerDuty etc.) exigiria serviço externo — não implementado agora; **não é bloqueio de go-live**.

## Backup / recovery

Plano Supabase atual: **Free**. O plano Free não garante backup automático diário nem Point-in-Time Recovery (PITR) — esses recursos começam no plano Pro. Não presumir que existe uma cópia gerenciada do banco; confirmar a retenção real em Supabase → Settings → Database → Backups antes de tratar isso como rede de segurança.

A rede de segurança real deste projeto é reconstrução, não backup gerenciado:
- **Migrations** (`supabase/migrations/`) — todo o schema é reproduzível a partir do Git, append-only.
- **RAW** (`raw.omie_records`) — payload bruto de cada entidade sincronizada; normalizado/analytics são recalculáveis a partir dele.
- **Código** e **documentação** — versionados em `origin/master`.
- **Dados fonte** — a Omie continua sendo o sistema operacional de registro; um resync completo reconstrói tudo.

## Recovery test (checklist de disaster recovery)

Não executado contra produção (destrutivo). Checklist para uso real se necessário:

1. Criar novo projeto Supabase.
2. Aplicar migrations: `npx supabase link --project-ref <novo-ref>` seguido de `npx supabase db push`.
3. Configurar `.env.local` (e os 5 secrets no GitHub Actions) apontando para o novo projeto.
4. Criar o primeiro ADMIN (Supabase Dashboard → Authentication → Users, depois promover via SQL — comando exato em `OPERATIONS.md`).
5. Resync completo da Omie: `npm run sync:onda1`, `sync:onda2`, `sync:onda3-pedidos`, `sync:dre-mappings`, nessa ordem.
6. Validar `analytics.*` retornando dado real (mesmo teste desta homologação: chamada autenticada a uma view simples).
7. Apontar o projeto Vercel para o novo Supabase (trocar as 2 variáveis públicas) e redeploy.

## Rollback

- **Aplicação**: Vercel mantém todo deploy anterior — "Promote to Production" no deploy anterior no dashboard reverte em segundos, sem precisar reverter Git.
- **Banco**: migrations são append-only por design — reverter uma migration aplicada significa escrever uma nova migration que desfaz o efeito (nunca editar/apagar a já aplicada).
- **Git**: nunca `push --force` em `origin/master`; a tag `pre-producao-v1` marca o checkpoint imediatamente anterior a este bloco.

## Incident response

1. Confirmar sintoma real (não assumir) — checar `/administracao`, aba Actions, e Supabase → Logs.
2. Se for sync: consultar `raw.sync_errors`/`raw.sync_runs`; liberar lock preso só com certeza de que não há execução real em andamento (comando em `OPERATIONS.md`).
3. Se for aplicação: checar deploy ativo na Vercel e seus logs de função.
4. Se for dado incorreto: nunca corrigir direto no banco sem entender a causa raiz — RAW preserva o payload original para comparar contra o que a Omie realmente enviou.
5. Documentar o incidente (causa, correção, se virou ADR) antes de considerar encerrado.

## Atualização de versão

Fluxo normal: commit pequeno e semântico → push em `origin/master` só com lint/typecheck/Vitest/build verdes → Vercel builda e promove automaticamente. Nenhuma etapa manual de versionamento além disso.
