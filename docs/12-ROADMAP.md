# Roadmap técnico

Cada etapa exige documentação atualizada, testes proporcionais e critérios de aceite explícitos.

0. **Fundação — concluída:** documentos, decisões, regras e Git.
1. **Bootstrap — concluída:** Next.js/TypeScript/Tailwind, lint/test, env example e estrutura de módulos. CI será adicionada quando houver repositório remoto autorizado.
2. **Banco — concluída:** Supabase local inicializado, schemas RAW/NORMALIZED/ANALYTICS, migrations, RLS-base e testes pgTAP preparados. Execução local do SQL aguarda runtime Docker.
3. **Auth — concluída:** login/logout, profile inativo por padrão, matriz fail-closed, proteção server-side e policies RLS. Validação PostgreSQL real aguarda Docker.
4. **Omie Core — concluída:** cliente server-only, timeout, retry/backoff, logs seguros e paginação genérica. RAW já existe desde a Etapa 2; jobs e contratos de entidades entram nas etapas seguintes.
5. **Cadastros-base — concluída:** clientes, vendedores, categorias e contas correntes com RAW, normalização, hash, paginação e upsert abstrato offline. Fornecedores e persistência Supabase concreta entram quando requeridos pela etapa correspondente.
6. **Financeiro — concluída:** receber/pagar, RAW, normalização, sinais, estados, relações opcionais, analytics inicial e regressões. Baixas detalhadas e reconciliação real dependem dos spikes de caixa/origem.
7. **Pedidos:** detalhes, cancelamento, etapas e ligação financeira validada.
8. **OS:** implementar após spikes de contrato/cancelamento/vencimento.
9. **DRE:** concluir spike Omie, classificação, views e drill-down.
10. **Fluxo de caixa:** realizado/projetado diário, saldos, mínimo e regressões.
11. **Comercial:** funil, vendedores, rankings e ABC com definições aprovadas.
12. **Executivo:** KPIs consolidados, metas, alertas e UX responsiva.
13. **Alertas:** regras, canais autorizados, deduplicação e auditoria.
14. **Multiusuário:** perfis completos, escopos e testes de autorização.
15. **Performance:** medição, índices, caching/materialização e carga.
16. **Produção:** segurança, backup/restore, observabilidade, runbooks e deploy autorizado.

Spikes de `13-OPEN-QUESTIONS.md` devem ocorrer antes da etapa que depende deles, não todos antecipadamente.

## Bloco comercial — Etapas 7, 8 e 11A

Implementado o núcleo offline de Pedidos, enriquecimento/parcelas, OS conservadora, mapeamento de etapas e views analíticas comerciais. Validação contra payload sanitizado e execução pgTAP local continuam condicionadas a ambiente/evidência externa.

## Bloco financeiro gerencial — Etapas 9 e 10

Implementados motor DRE gerencial, hierarquia configurável, cobertura de mappings, saldo por conta/consolidado, realizado, projeção, caixa mínimo e sinais de risco. Competência contábil, devoluções e data real de baixa permanecem fora do escopo até evidência.

## Bloco de experiência gerencial

Implementados shell responsivo, navegação por role, consultas analytics server-side, Visão Geral, Financeiro, Caixa, DRE, Comercial, Alertas, parâmetros ADMIN, filtros e estados de interface. Recharts é a biblioteca visual única. A conexão operacional com dados reais, edição completa dos mappings e refinamentos de produção permanecem nos blocos seguintes.
