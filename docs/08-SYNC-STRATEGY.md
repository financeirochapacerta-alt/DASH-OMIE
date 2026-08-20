# Estratégia de sincronização

## Pipeline

1. Planejar execução independente por entidade e janela/cursor.
2. Paginar e gravar RAW antes de transformar.
3. Normalizar com upsert por ID Omie e idempotência.
4. Atualizar analytics de modo transacional ou recuperável.
5. Registrar contagens, duração, cursor, tentativas, erros e reconciliação.

## Persistência preparada

`raw.sync_runs` registra cada entidade/execução; `raw.sync_entity_state` mantém cursor e último sucesso por entidade; `raw.sync_errors` isola falhas. `raw.omie_records` preserva payloads e `raw.omie_webhook_events` funciona como inbox idempotente quando houver `event_id`. Nenhum cliente ou agendamento Omie foi implementado nesta etapa.

## Resiliência

Retry apenas para falhas transitórias; exponential backoff com jitter; respeito a 429; limites de tentativas; dead-letter/reprocessamento; correlação por execução/item. Falha de uma entidade não bloqueia as demais.

O cliente base repete HTTP 429, HTTP 5xx, timeout e falhas de rede, com até seis retries, espera exponencial iniciando em 2 segundos e teto de 60 segundos. `Retry-After` é respeitado dentro desse teto. A paginação genérica usa lotes de 50 e intervalo padrão de 800 ms, ambos configuráveis. O motor de sincronização, cursores e jobs permanecem para as etapas de entidades; nenhuma estratégia incremental foi presumida.

## Incremental e reconciliação

Usar `last-modified`/cursor somente após confirmar endpoint a endpoint. Onde indisponível, usar janelas sobrepostas e upsert. Executar reconciliação periódica mais ampla para mudanças tardias, cancelamentos e lacunas. Webhooks aceleram atualização, mas não são fonte única.

## Exclusões

Não apagar por ausência em uma página. Política de tombstone/ausência depende do spike sobre exclusões reais da Omie.
