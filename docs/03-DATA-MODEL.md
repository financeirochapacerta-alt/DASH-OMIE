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

## Auditoria

Manter origem, timestamps de negócio e ingestão separados, execução de sync e transformação aplicada. Exclusão na Omie não deve ser presumida: aguarda spike.
