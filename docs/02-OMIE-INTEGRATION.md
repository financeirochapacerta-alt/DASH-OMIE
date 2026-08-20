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

## Cliente base implementado

O cliente server-only usa `https://app.omie.com.br/api/v1`, encapsula o envelope padrão com `app_key`, `app_secret`, `call` e `param`, e aplica timeout de 30 segundos. Erros HTTP e faults funcionais são normalizados sem expor credenciais. A base permanece genérica: contratos específicos de entidades serão adicionados somente após a validação de cada endpoint.
