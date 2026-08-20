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
