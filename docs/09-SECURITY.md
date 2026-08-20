# Segurança

## Regras absolutas

- App Key/App Secret Omie ficam somente no backend, em secrets do ambiente; nunca bundle, browser, commit ou log público.
- Toda comunicação Omie passa pelo backend.
- `.env*` real deve ser ignorado; fornecer apenas exemplo sem valores quando o bootstrap ocorrer.

## Controles planejados

Supabase Auth; autorização server-side e RLS por menor privilégio; perfis possíveis ADMIN, DIRETORIA, FINANCEIRO, COMERCIAL, PRODUCAO e VIEWER. Implementação será incremental, sem assumir que perfil de UI substitui autorização no banco/backend.

Validar entrada e webhook, limitar taxa, proteger contra replay, registrar auditoria de ações sensíveis e redigir logs. Rotacionar secrets em incidente. Dependency/secret scanning e headers seguros entram no bootstrap/produção conforme roadmap.

