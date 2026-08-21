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

O shell filtra a navegação por role, mas cada rota também valida sessão, profile ativo e área no servidor antes de consultar analytics. As consultas ficam centralizadas em `features/management`, nunca acessam RAW e não enviam dados financeiros a roles sem policy. Configurações são gravadas por Server Action ADMIN e continuam sujeitas a RLS. Alteração de role/status de usuário (`/usuarios`) usa o mesmo padrão: Server Action ADMIN-only que grava pelo cliente autenticado normal — a policy `profiles_update_admin` já nega a operação a qualquer outro role no próprio Postgres, então nenhuma rota usa `service_role` no fluxo de sessão ou de administração de usuários.

## Auditoria de segurança (Onda de homologação, 2026-08-21)

Supabase Security Advisor (`supabase db advisors --linked --type security`) revisado após todas as migrations desta etapa:

- **2 avisos revisados e intencionais**: `public.admin_sync_status()` e `public.admin_active_locks()` são `SECURITY DEFINER` executáveis por `authenticated` (necessário porque `raw.*` não é exposto pela Data API — ADR-007). Diferente das funções `operational_*` (restritas a `service_role` via grant), estas precisam ser chamadas pela sessão normal do ADMIN logado; a proteção não é o grant, é a checagem interna `private.has_role(['ADMIN','DIRETORIA'])` que lança exceção (`insufficient_privilege`) para qualquer outro role — mesmo padrão de `private.has_role`/`private.is_active_user()` já usados em todo o projeto.
- **1 pendência real para produção**: "Leaked Password Protection" está desabilitada no Auth do projeto (checagem de senha vazada contra HaveIBeenPwned). É uma configuração do painel do Supabase (Authentication → Policies), não uma migration — não foi alterada aqui porque afeta a política de senha de todos os usuários e não há evidência de que `supabase config push`/`config.toml` sincronize esse toggle específico para o projeto remoto sem confirmação manual. Recomendado ativar antes de produção.
- RLS, grants, `search_path` vazio em funções `security definer`, isolamento de `raw`, e ausência de `service_role`/segredos Omie no bundle do navegador foram reauditados manualmente nesta etapa (código de `features/management`, `features/auth`, Server Actions e `lib/supabase/*`) — nenhum novo problema encontrado.
