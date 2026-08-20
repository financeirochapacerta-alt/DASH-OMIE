# Regras de negócio

## Financeiro

- Recebível: `signed_value = abs(valor_documento)`; pagável: `signed_value = -abs(valor_documento)`. O payload afirma valor positivo; `original_value` é preservado.
- Título vencido e aberto entra na projeção na data atual, sem desaparecer.
- Datas de competência, emissão, vencimento, baixa e ingestão são conceitos distintos.
- Status original é preservado. `pago`, `recebido`, `liquidado`, `baixado` e `quitado` indicam liquidação; `cancelado` é independente. Status desconhecido falha fechado como não liquidado e não cancelado, permanecendo auditável.
- Cancelados são armazenados, mas excluídos de movimentos, abertos e vencidos. Aberto significa simultaneamente não liquidado e não cancelado.

## Pedidos

- Cancelamento confirmado é `infoCadastro.cancelado` obtido por `ConsultarPedido`; prevalece sobre “Faturado” e exclui inflação de vendas/DRE.
- `data_previsao` não é automaticamente vencimento financeiro.
- Após faturamento, parcelas financeiras são 1:N. O uso histórico da primeira `lista_parcelas.parcela[].data_vencimento` é referência, não justificativa para descartar as demais.
- Etapas padrão configuráveis: Pedido de Venda, Em Produção, Faturar, Faturado. Preservar código Omie.

## Ordens de serviço

Etapas padrão configuráveis: Ordem de Serviço, Em Execução, Executado, Faturar, Faturado. Cancelamento, vencimento e comportamento de `ConsultarOS` permanecem não confirmados.

## Janelas iniciais

Pedidos/OS: 2025-01-01 até hoje. Receber/pagar: 2025-01-01 até hoje + 1 ano. Incremental e reconciliação poderão aperfeiçoar isso sem perder histórico.

## Comercial

- Pedido só participa dos indicadores quando `is_cancelled = false`; estado nulo é excluído conservadoramente até enriquecimento.
- OS participa sem inferência de cancelamento; esse estado continua desconhecido e visível como qualidade de dados.
- Faturado deriva da data de faturamento ou classificação configurada `Faturado`. Estágios comerciais conhecidos compõem `to_invoice`; demais casos são `unknown`.
- Previsão do pedido e vencimento real da primeira parcela são datas distintas. Não existe uma “data da venda” genérica.

## DRE e caixa

- A DRE inicial é gerencial por vencimento, não competência contábil estrita. Usa `signed_value`, exclui cancelados e expõe categorias sem mapping como `unmapped`.
- Saldo atual soma ao saldo inicial apenas títulos quitados, vinculados à conta e com vencimento desde `balance_date`. Somente contas selecionadas, ativas e não bloqueadas entram no consolidado.
- Realizado contém quitados; projetado contém abertos não cancelados. Vencidos são apresentados hoje na projeção sem alterar `due_date`.
