# Modelo de dados

## Camadas obrigatórias

### RAW

Payload JSON original, metadados de origem/ingestão, identificador externo, tipo de entidade/evento, status de processamento e erro. Evitar mutação; novas capturas geram versões/eventos.

### NORMALIZED

Tabelas tipadas para entidades Omie e relações. Todas guardam o ID Omie e rastreabilidade ao RAW. Financeiros preservam `original_value` e derivam `signed_value`. Pedidos/OS preservam códigos de etapa; parcelas são relação 1:N, nunca coluna única.

### BUSINESS / ANALYTICS

Views/materialized views/funções para indicadores, DRE, funil e caixa. Devem ser determinísticas, versionáveis e testadas. Materialização só após medição.

## Convenções a decidir na Etapa 2

Schemas físicos, nomes, tipos monetários, timezone, chaves, política de retenção e estratégia de soft delete/tombstone. Usar `numeric`, nunca ponto flutuante, para dinheiro. Integridade e índices serão definidos conforme consultas.

## Auditoria

Manter origem, timestamps de negócio e ingestão separados, execução de sync e transformação aplicada. Exclusão na Omie não deve ser presumida: aguarda spike.

