# Roadmap técnico

Cada etapa exige documentação atualizada, testes proporcionais e critérios de aceite explícitos.

0. **Fundação — concluída:** documentos, decisões, regras e Git.
1. **Bootstrap — concluída:** Next.js/TypeScript/Tailwind, lint/test, env example e estrutura de módulos. CI será adicionada quando houver repositório remoto autorizado.
2. **Banco — concluída:** Supabase local inicializado, schemas RAW/NORMALIZED/ANALYTICS, migrations, RLS-base e testes pgTAP preparados. Execução local do SQL aguarda runtime Docker.
3. **Auth:** login, sessão, autorização mínima e RLS testada.
4. **Omie Core:** cliente server-only, throttling, retry, logs, RAW, jobs e fixtures.
5. **Cadastros:** clientes, fornecedores, categorias/contas e mapeamentos configuráveis.
6. **Financeiro:** receber/pagar, sinais, estados, parcelas e reconciliação.
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
