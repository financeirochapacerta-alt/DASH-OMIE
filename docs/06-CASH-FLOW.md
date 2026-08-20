# Fluxo de caixa

## Conceitos separados

- **Saldo atual:** posição observada por conta e consolidada.
- **Realizado:** movimentos efetivamente baixados/recebidos.
- **Projetado:** saldo atual + entradas e saídas previstas, diariamente.

## Regras

Títulos vencidos e abertos são reposicionados para hoje na projeção. O título original e seu vencimento permanecem auditáveis. Pagáveis têm sinal negativo; recebíveis, positivo. Datas reais de baixa ainda exigem validação Omie.

A etapa financeira preserva `due_date`, `forecast_date`, sinal, liquidação, cancelamento e conta corrente. Ela não reposiciona `due_date`; essa transformação pertence exclusivamente à projeção futura.

## Saídas planejadas

Saldo consolidado/por conta, entradas/saídas previstas, saldo diário projetado, primeira data negativa, caixa mínimo configurável e alertas. Não misturar realizado e projetado em uma série sem identificação explícita.

## Motor inicial

O saldo por conta parte de `initial_balance` e incorpora quitados vinculados desde `balance_date`; somente `selected_for_cash`, não bloqueadas e ativas entram no consolidado. A projeção global independe de conta futura, reposiciona vencidos abertos para hoje e preserva sua data original. `minimum_cash` e `cash_projection_days` vêm de `management_settings`, com defaults 0 e 30. São produzidos primeiro dia negativo, primeiro abaixo do mínimo, entradas/saídas, heatmap de pagamentos e séries diária/mensal.
