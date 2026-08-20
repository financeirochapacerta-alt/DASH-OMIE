# Modelo de dados

## Camadas obrigatórias

### RAW

Payload JSON original, metadados de origem/ingestão, identificador externo, tipo de entidade/evento, status de processamento e erro. Evitar mutação; novas capturas geram versões/eventos.

### NORMALIZED

Tabelas tipadas para entidades Omie e relações. Todas guardam o ID Omie e rastreabilidade ao RAW. Financeiros preservam `original_value` e derivam `signed_value`. Pedidos/OS preservam códigos de etapa; parcelas são relação 1:N, nunca coluna única.

### BUSINESS / ANALYTICS

Views/materialized views/funções para indicadores, DRE, funil e caixa. Devem ser determinísticas, versionáveis e testadas. Materialização só após medição.

## Convenções implementadas na Etapa 2

- Schemas: `raw` para ingestão/auditoria, `public` para o modelo normalizado e configurações, `analytics` para views gerenciais.
- IDs RAW/eventos usam UUID; entidades normalizadas usam `bigint identity` interno e preservam `omie_id` único.
- Dinheiro usa `numeric(18,2)`; datas civis usam `date`; eventos usam `timestamptz`.
- FKs históricas usam `restrict` ou `set null`, sem cascata destrutiva. Toda FK recebeu índice compatível com o acesso esperado.
- `updated_at` é mantido por um trigger comum. Retenção e tombstones continuam dependentes da investigação sobre exclusões Omie.

Recebíveis e pagáveis derivam `signed_value` por coluna gerada no banco, impedindo divergência do valor original. `is_cancelled` de pedidos/OS permanece nullable quando a confirmação ainda não existe.

Nos cadastros-base, a persistência sincronizada usa o identificador Omie como chave de upsert e hash SHA-256 canônico para detectar payload inalterado. Campos gerenciais locais não pertencem ao DTO sincronizado: em especial, `bank_accounts.selected_for_cash` nunca integra o conjunto de atualização da Omie e deve ser preservado em todo upsert.

Recebíveis e pagáveis mantêm `original_value` não negativo e têm `signed_value` gerado pelo PostgreSQL, positivo e negativo respectivamente. O normalizador reproduz o sinal em representação decimal textual para validação e analytics offline, sem usar ponto flutuante como fonte de verdade. Chaves para cliente/fornecedor, vendedor, categoria e conta corrente são resolvidas por adapter e aceitam `NULL`.

## Auditoria

Manter origem, timestamps de negócio e ingestão separados, execução de sync e transformação aplicada. Exclusão na Omie não deve ser presumida: aguarda spike.

## Núcleo comercial

`sales_orders` e `service_orders` aceitam cliente/vendedor ausente para preservar registros da origem. Parcelas pertencem a um pedido e são deduplicadas por número ou referência Omie. RAW de listagem e RAW de detalhe de pedido são entidades distintas. Views comerciais ficam em `analytics`, com `security_invoker`.

## Financeiro gerencial

A DRE consome `analytics.financial_movements` e mantém drill-down por título, categoria, conta DRE, grupo, tipo e mês. Mappings possuem ordens estáveis por nível. Caixa mantém saldo por conta selecionada, realizado diário/mensal e projeção diária; vencimento original nunca é reescrito.
