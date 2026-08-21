# Registro de decisões

## ADR-001 — Separação de fontes e responsabilidades

- Status: aceito — 2026-08-20
- Decisão: Omie operacional; PostgreSQL analítico; backend integra/aplica regras; frontend apresenta.
- Motivo: segurança, auditabilidade, performance e consistência.

## ADR-002 — Três camadas de dados

- Status: aceito — 2026-08-20
- Decisão: RAW, NORMALIZED e BUSINESS/ANALYTICS explicitamente separadas e rastreáveis.
- Motivo: auditoria, reprocessamento e evolução independente.

## ADR-003 — Sincronização híbrida resiliente

- Status: aceito — 2026-08-20
- Decisão: incremental/upsert por entidade, inbox assíncrona para webhooks e reconciliação periódica obrigatória.
- Motivo: webhooks e cursores podem ter lacunas; cargas monolíticas são frágeis.

## ADR-004 — Stack preferencial e custo

- Status: aceito como direção — 2026-08-20
- Decisão: Next.js, TypeScript, Tailwind, PostgreSQL/Supabase e Supabase Auth; gráficos após avaliação. Priorizar tier gratuito sem sacrificar requisitos.
- Consequência: versões e bibliotecas específicas serão decididas no bootstrap.

## ADR-005 — Regras financeiras fora da UI

- Status: aceito — 2026-08-20
- Decisão: sinais, cancelamento, DRE e caixa são calculados no backend/banco e protegidos por testes; originais preservados.

## ADR-006 — Supabase SSR e validação de ambiente

- Status: aceito — 2026-08-20
- Decisão: usar `@supabase/ssr` atual com clientes browser/server separados; o cliente comum usa chave anon, e service role/Omie permanecem em módulo protegido por `server-only`. Zod centraliza contratos de ambiente.
- Motivo: impedir importação acidental de secrets no browser e validar configuração na fronteira, sem conectar projeto real.

## ADR-007 — Schemas, chaves e exposição do banco

- Status: aceito — 2026-08-20
- Decisão: separar `raw`, `public` normalizado e `analytics`; usar UUID em ingestão/eventos e `bigint identity` internamente nas entidades normalizadas. `raw` fica fora dos schemas expostos; `analytics` é exposto somente por views `security_invoker` após a Etapa 3. Tabelas usam RLS.
- Motivo: rastreabilidade, índices menores no modelo relacional e menor superfície de acesso.

## ADR-008 — Sinal financeiro como dado derivado

- Status: aceito — 2026-08-20
- Decisão: `signed_value` é coluna gerada a partir de `original_value`: positiva em recebíveis e negativa em pagáveis; valores originais não negativos são protegidos por constraint.
- Motivo: tornar a regra invariável no banco e independente do frontend/importador.

## ADR-009 — Roles canônicas e provisionamento fechado

- Status: aceito — 2026-08-20
- Decisão: roles usam enum PostgreSQL; `public.profiles` é a fonte canônica, nunca metadata do usuário. Novo usuário recebe `VIEWER` inativo e cadastro público fica desabilitado. O primeiro ADMIN exige provisionamento administrativo autorizado.
- Motivo: negar acesso por padrão e impedir escalada por dados manipuláveis no client.

## ADR-010 — Autorização em profundidade

- Status: aceito — 2026-08-20
- Decisão: RLS aplica a matriz no banco; server components validam claims e profile; `proxy.ts` limita-se a refresh/redirecionamento otimista. Helpers `security definer` ficam em schema privado, sem parâmetros de identidade e com `search_path` vazio.
- Motivo: evitar que UI, cookies não validados ou recursão de policies se tornem fronteira de segurança.

## ADR-011 — Cliente Omie resiliente e testável

- Status: aceito — 2026-08-20
- Decisão: centralizar autenticação e chamadas Omie em cliente server-only, com timeout de 30 segundos, até seis retries exponenciais para 429/5xx/rede/timeout, teto de 60 segundos e suporte a `Retry-After`. Paginação usa tamanho 50 e pausa padrão de 800 ms, com transporte e espera injetáveis.
- Motivo: impedir vazamento de secrets, padronizar falhas e permitir testes offline determinísticos sem fixar prematuramente contratos de entidades.

## ADR-012 — Upsert separa dados Omie de configuração local

- Status: aceito — 2026-08-20
- Decisão: adapters de persistência recebem somente campos sincronizáveis; configurações gerenciais locais são omitidas do update. `bank_accounts.selected_for_cash` é o primeiro campo protegido por esse padrão. Payload RAW recebe hash SHA-256 sobre JSON canônico para detecção de igualdade.
- Motivo: permitir atualização operacional idempotente sem apagar decisões locais e evitar updates desnecessários.

## ADR-013 — Sinal e status financeiro em profundidade

- Status: aceito — 2026-08-20
- Decisão: preservar valor/status originais; validar o sinal no normalizador e gerá-lo novamente no PostgreSQL. Classificação de liquidação/cancelamento é central, case-insensitive e fail-safe. Analytics exclui cancelados e define aberto/vencido somente entre títulos não liquidados e não cancelados.
- Motivo: impedir a regressão histórica de somar despesas como entradas e manter estados desconhecidos auditáveis sem suposições silenciosas.

## ADR-014 — Elegibilidade e enriquecimento comercial conservadores

- Status: aceito — 2026-08-20
- Decisão: `codigo_pedido` e `nCodOS` são identidades técnicas. Pedido entra em analytics somente após cancelamento confirmado como falso; seu detalhe e parcelas são enriquecidos em fila deduplicada com RAW separado. OS não infere cancelamento nem vencimento real. Classificações de etapa permanecem configuráveis.
- Motivo: evitar faturamento inflado por cancelados/estados desconhecidos e preservar dados incompletos para reconciliação.

## ADR-015 — DRE gerencial por vencimento e caixa em três conceitos

- Status: aceito — 2026-08-20
- Decisão: a DRE inicial usa vencimento, `signed_value` e mappings configuráveis, mantendo `unmapped` auditável. Caixa separa posição atual por contas selecionadas, realizado quitado e projeção de abertos; vencidos são reposicionados somente na projeção. Limite mínimo e horizonte são configurações únicas.
- Motivo: entregar gestão reproduzível sem alegar competência contábil ou data de baixa ainda não confirmadas, preservando sinal e datas originais.

## ADR-017 — Saldo de caixa sem data de referência conhecida

- Status: aceito — 2026-08-21
- Decisão: em `analytics.cash_account_balances`, quando `bank_accounts.balance_date` é `null`, contar todos os movimentos quitados e não cancelados da conta (sem filtrar por `due_date >= balance_date`), em vez de retornar 0.
- Motivo: validação com dados reais da Onda 2 mostrou contas sem `saldo_data` na Omie (ex.: Caixinha, Adiantamento de Cliente) tendo 100% dos seus movimentos quitados reais (R$ 36.385,79 líquidos, 156 títulos) silenciosamente descartados pelo filtro `due_date >= balance_date`, que avalia para `null` quando `balance_date` é `null`. Isso fazia o saldo aparecer como 0 — indistinguível de "sem atividade" — quando na verdade era "referência desconhecida". Corrigido em `20260821150000_fix_cash_balance_null_reference_date.sql`.

## ADR-018 — Classificação DRE automática a partir do `dadosDRE` da Omie

- Status: aceito — 2026-08-21
- Decisão: `dre_category_mappings` é populada automaticamente (`source = 'omie'`) a partir de `categories.codigo_dre`/`categories.dre_metadata`, usando apenas os campos confirmados com dados reais (`codigoDRE`, `descricaoDRE`, `sinalDRE`). `dre_type`/`dre_group` são os segmentos do próprio `codigoDRE` (a Omie não nomeia esses níveis); `dre_account` é o `descricaoDRE` da Omie. `sinalDRE` é preservado em `sign_behavior` como metadado, nunca usado para recalcular `signed_value`. Categoria sem `codigoDRE`, sem `descricaoDRE`, ou com código fora do formato de 3 segmentos confirmado, permanece `unmapped` — nada é inferido por nome de categoria. A sincronização (`npm run sync:dre-mappings`) é idempotente e nunca lê/sobrescreve uma linha `source = 'manual'`; `analytics.dre_details` prioriza explicitamente `manual` sobre `omie` quando ambos existem para a mesma categoria (`20260821160000_dre_manual_override_priority.sql`).
- Motivo: evidência real (Onda 2, 143 categorias, 80 com `codigoDRE`) mostrou 100% da DRE aparecendo como `unmapped`; a própria Omie já fornece classificação estruturada suficiente para eliminar isso sem inventar hierarquia nem tocar no sinal financeiro. Validado: total assinado de julho/2026 idêntico antes e depois (R$ 43.634,35).

## ADR-016 — Shell gerencial server-first e visualização única

- Status: aceito — 2026-08-20
- Decisão: usar App Router/Server Components para autorização e leitura centralizada de analytics; Client Components ficam restritos ao shell interativo e gráficos. Recharts, em versão fixada, é a única biblioteca de gráficos. Ausência de dados gera empty state, nunca fixtures no produto.
- Motivo: reduzir exposição de dados, fetch duplicado e lógica crítica no browser, mantendo uma experiência responsiva e coerente.
