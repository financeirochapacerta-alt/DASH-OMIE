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

## Cadastros-base implementados

Os módulos offline de clientes (`geral/clientes`), vendedores (`geral/vendedores`), categorias (`geral/categorias`) e contas correntes (`geral/contacorrente`) usam os respectivos métodos `Listar*` e a paginação comum. Os DTOs cobrem somente identificadores, nomes, estados e dados técnicos requeridos pelo modelo. Payloads completos continuam preservados em RAW; metadata DRE não define ainda a estrutura final da DRE.

A documentação oficial consultada em 2026-08-20 confirma filtros por data para clientes e vendedores, além de hora para clientes. Esses filtros são opcionais e específicos por módulo. Categorias e contas correntes permanecem em full listing até confirmação equivalente.

## Financeiro implementado

Contas a receber (`financas/contareceber`, `ListarContasReceber`) e contas a pagar (`financas/contapagar`, `ListarContasPagar`) usam o Omie Core e o pipeline RAW/normalização/upsert existente. Os DTOs mínimos preservam IDs de relacionamento, datas, valor original, status, documento e parcela; relações ausentes permanecem nulas e nunca impedem a captura do título.
