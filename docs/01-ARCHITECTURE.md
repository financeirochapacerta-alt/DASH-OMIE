# Arquitetura

## Princípios

- Omie é a fonte operacional; banco é a fonte analítica.
- Backend concentra integrações, autorização e regras; frontend consome contratos tratados.
- RAW é imutável/auditável; NORMALIZED é relacional/tipado; BUSINESS/ANALYTICS oferece métricas e regras.
- Preferir componentes gratuitos, simples e substituíveis.

## Componentes planejados

- Next.js/TypeScript, Tailwind CSS e biblioteca de gráficos a avaliar na implementação.
- PostgreSQL gerenciado pelo Supabase, Supabase Auth e migrations versionadas.
- Rotas/ações server-side para acesso autenticado; workers/jobs para cargas demoradas.
- Observabilidade com logs estruturados de sync, correlação e métricas, sem secrets/PII desnecessária.

## Limites

O browser nunca chama Omie nem recebe App Key/Secret. Jobs não agrupam chamadas caras de detalhes em uma execução monolítica. Regras críticas devem estar no backend/banco e cobertas por testes.

## Fluxo de dados

Webhooks: evento → inbox RAW idempotente → processamento assíncrono → normalized → analytics. Sincronização: cursor/janela por entidade → paginação → upsert → reconciliação. A aplicação lê analytics e, quando necessário, normalized auditável.

