# Segurança

## Regras absolutas

- App Key/App Secret Omie ficam somente no backend, em secrets do ambiente; nunca bundle, browser, commit ou log público.
- Toda comunicação Omie passa pelo backend.
- `.env*` real deve ser ignorado; fornecer apenas exemplo sem valores quando o bootstrap ocorrer.

## Controles planejados

Supabase Auth; autorização server-side e RLS por menor privilégio; perfis possíveis ADMIN, DIRETORIA, FINANCEIRO, COMERCIAL, PRODUCAO e VIEWER. Implementação será incremental, sem assumir que perfil de UI substitui autorização no banco/backend.

Validar entrada e webhook, limitar taxa, proteger contra replay, registrar auditoria de ações sensíveis e redigir logs. Rotacionar secrets em incidente. Dependency/secret scanning e headers seguros entram no bootstrap/produção conforme roadmap.

## Auth e autorização

Supabase Auth usa login interno por e-mail/senha, sem cadastro público. O trigger de `auth.users` cria `public.profiles` como `VIEWER` inativo; nenhuma metadata controlada pelo usuário define role. A ativação e promoção exigem ADMIN, e não há criação automática de ADMIN.

RLS protege todas as tabelas normalizadas. Funções de policy consultam `auth.uid()` e o profile ativo em schema privado, com `search_path` vazio e grants mínimos. Entidades sincronizadas são somente leitura para perfis autorizados; apenas configurações possuem escrita ADMIN. RAW não tem grants para usuários. Analytics está exposto à Data API apenas por views `security_invoker`, herdando o RLS subjacente. A matriz detalhada está em `14-AUTHORIZATION-MATRIX.md`.

No app, `proxy.ts` renova cookies e faz redirecionamento otimista. Páginas protegidas validam claims no servidor e consultam o profile canônico; o frontend não decide autorização. Service role permanece server-only e não é utilizada no fluxo de sessão.

## Credenciais Omie

`OMIE_APP_KEY` e `OMIE_APP_SECRET` são validadas apenas quando o cliente Omie é criado, sempre em módulo marcado `server-only`. O logger estruturado registra somente metadados operacionais — endpoint, call, tentativa, status e duração — e os erros normalizados redigem qualquer ocorrência das credenciais.

As views de DRE e caixa usam `security_invoker`; os objetos são negados a `anon` e concedidos explicitamente a `authenticated`, mantendo RLS das tabelas-base. FINANCEIRO pode ler somente as configurações `minimum_cash` e `cash_projection_days`; alteração continua restrita a ADMIN.
