# Indicadores planejados

Todos os indicadores devem declarar definição, filtros, granularidade, timezone, fonte, atualização e regra de cancelamento antes de serem publicados.

- Executivo: faturamento, meta/atingimento, carteira, a faturar, receber, vencidos, pagar, saldo, projeção, resultado e alertas.
- Financeiro: receber/pagar, vencidos/hoje, inadimplência, evolução mensal, top despesas e heatmap.
- Comercial: pedidos, OS, funil, vendedores, ticket, faturado vs. a faturar, ranking e ABC de clientes.
- DRE: mensal, acumulado, comparativos e drill-down.
- Caixa: diário/acumulado, projeção, mínimo e alertas.

Metas, inadimplência, carteira, resultado e Curva ABC precisam de definições formais antes da implementação.

O núcleo comercial entrega total, quantidade, ticket médio, faturado/a faturar, ranking por vendedor/cliente, pipeline e ABC. A ABC atual ordena faturamento elegível decrescente (cliente como desempate), usa percentuais cumulativos A até 80%, B até 95% e C acima disso. É uma definição técnica inicial, a validar com o negócio.

DRE gerencial informa valores mensais/acumulados por toda a hierarquia e cobertura de mapping. Caixa informa posição por conta/consolidada, realizado, projeção diária, entradas, saídas, primeiro saldo negativo, primeiro saldo abaixo do mínimo, vencidos acumulados e concentração diária de pagamentos.

## Experiência gerencial

A primeira experiência apresenta Visão Geral, Financeiro, Caixa, DRE, Comercial e Alertas com filtros de período compartilhados. Metas usam percentual, faltante, necessidade por dia útil e ritmo esperado versus realizado. Inadimplência é indicador gerencial `vencidos / abertos`, nunca índice contábil oficial. Alertas são determinísticos, priorizados e separados de qualidade de dados.
