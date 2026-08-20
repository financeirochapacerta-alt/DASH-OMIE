# Indicadores planejados

Todos os indicadores devem declarar definição, filtros, granularidade, timezone, fonte, atualização e regra de cancelamento antes de serem publicados.

- Executivo: faturamento, meta/atingimento, carteira, a faturar, receber, vencidos, pagar, saldo, projeção, resultado e alertas.
- Financeiro: receber/pagar, vencidos/hoje, inadimplência, evolução mensal, top despesas e heatmap.
- Comercial: pedidos, OS, funil, vendedores, ticket, faturado vs. a faturar, ranking e ABC de clientes.
- DRE: mensal, acumulado, comparativos e drill-down.
- Caixa: diário/acumulado, projeção, mínimo e alertas.

Metas, inadimplência, carteira, resultado e Curva ABC precisam de definições formais antes da implementação.

O núcleo comercial entrega total, quantidade, ticket médio, faturado/a faturar, ranking por vendedor/cliente, pipeline e ABC. A ABC atual ordena faturamento elegível decrescente (cliente como desempate), usa percentuais cumulativos A até 80%, B até 95% e C acima disso. É uma definição técnica inicial, a validar com o negócio.
