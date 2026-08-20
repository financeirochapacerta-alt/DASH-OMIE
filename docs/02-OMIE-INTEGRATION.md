# Integração Omie

## Contrato operacional

- Toda chamada ocorre no backend com segredo em variável de ambiente server-only.
- Persistir payload original, endpoint, entidade, identificador Omie, horário de ingestão e hash/versão quando útil.
- Paginar; limitar concorrência; tratar timeout, falhas transitórias e HTTP 429 com exponential backoff e jitter.
- Tornar processamento idempotente e isolar falhas por entidade/item.

## Entidades iniciais

Cadastros, contas a receber/pagar, pedidos e ordens de serviço. Endpoints e campos exatos serão validados por spike antes da implementação de cada entidade.

## Regras conhecidas

Para pedido, não inferir cancelamento pela etapa: consultar/persistir `infoCadastro.cancelado` de `ConsultarPedido`. Preservar códigos originais e configurar mapeamentos. Consultas de detalhe em massa devem usar fila/background.

## Webhooks

Registrar primeiro em inbox bruta, deduplicar e processar de modo assíncrono. Disponibilidade/eventos atuais são uma pendência técnica. Mesmo adotados, manter reconciliação periódica.

Consulte `08-SYNC-STRATEGY.md` e `13-OPEN-QUESTIONS.md`.

