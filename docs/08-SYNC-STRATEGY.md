# Estratégia de sincronização

## Pipeline

1. Planejar execução independente por entidade e janela/cursor.
2. Paginar e gravar RAW antes de transformar.
3. Normalizar com upsert por ID Omie e idempotência.
4. Atualizar analytics de modo transacional ou recuperável.
5. Registrar contagens, duração, cursor, tentativas, erros e reconciliação.

## Resiliência

Retry apenas para falhas transitórias; exponential backoff com jitter; respeito a 429; limites de tentativas; dead-letter/reprocessamento; correlação por execução/item. Falha de uma entidade não bloqueia as demais.

## Incremental e reconciliação

Usar `last-modified`/cursor somente após confirmar endpoint a endpoint. Onde indisponível, usar janelas sobrepostas e upsert. Executar reconciliação periódica mais ampla para mudanças tardias, cancelamentos e lacunas. Webhooks aceleram atualização, mas não são fonte única.

## Exclusões

Não apagar por ausência em uma página. Política de tombstone/ausência depende do spike sobre exclusões reais da Omie.

