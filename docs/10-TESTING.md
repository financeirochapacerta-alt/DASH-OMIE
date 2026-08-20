# Estratégia de testes

## Pirâmide

- Unitários: sinais, datas, cancelamento, classificação e transformações.
- Integração: fixtures Omie → RAW → normalized → analytics; migrations/RLS.
- Contrato: formatos dos endpoints com fixtures sanitizadas.
- E2E: jornadas críticas autenticadas quando a UI existir.

## Fixtures obrigatórias

Pedido normal, cancelado, faturado e com múltiplas parcelas; recebível e pagável em estados aberto, quitado, vencido e cancelado. Payloads devem ser sanitizados e versionados.

## Regressões obrigatórias

- Receber positivo; pagar negativo.
- Cancelado não infla vendas nem DRE.
- Vencido aberto permanece no caixa.
- Pedido faturado distingue previsão de vencimento.
- Pedido faturado e cancelado: cancelamento prevalece.

Testar idempotência, paginação, retry/429, reprocessamento e reconciliação. “Compila” não é critério de aceite; etapa exige testes aplicáveis e revisão dos resultados.

## Banco local

Testes pgTAP em `supabase/tests` verificam schemas e invariantes de sinal/valor. Execute `npm run test:db` após iniciar a stack local com Docker. Os testes TypeScript de sinal rodam sem Docker; as colunas geradas e constraints são a proteção canônica no banco.

Testes unitários da matriz cobrem ADMIN, FINANCEIRO, COMERCIAL, PRODUCAO, VIEWER, usuário inativo e role desconhecida. A validação estática deve rejeitar `using (true)`, grants anônimos, funções `security definer` sem `search_path` controlado e policies de update sem `with check`. A execução real das migrations/RLS e do pgTAP continua pendente enquanto o ambiente não possuir Docker.

## Omie Core

Os testes do cliente são totalmente offline: transporte e espera são injetados, e timers falsos validam timeout sem acessar a API real. A suíte cobre payload padrão, sucesso, faults funcionais, 400 sem retry, 429/5xx com retry, `Retry-After`, limite de tentativas, backoff, paginação e redação de secrets.

Fixtures sanitizadas cobrem clientes, vendedores, categorias e contas correntes. Testes unitários validam DTOs mínimos, S/N, datas brasileiras, NUMERIC como string, hash canônico, múltiplas páginas, RAW antes da normalização, resultados de upsert, isolamento de falhas e preservação de `selected_for_cash`. Todo transporte e repositório é injetado; nenhuma suíte acessa Omie ou Supabase remoto.

As regressões financeiras cobrem sinal positivo/negativo, consolidação exata de 1000 - 400 = 600, classificação de status, cancelamento, vencidos, datas, FKs nulas, paginação e independência dos syncs. Um teste pgTAP adicional valida as views financeiras quando a stack Docker estiver disponível.

O bloco comercial tem fixtures/testes offline para IDs técnicos versus números de exibição, totais decimais, relações ausentes, parcelas múltiplas/duplicadas/inválidas, separação previsão-vencimento, fila de enriquecimento, cancelamento conservador, OS incompleta, faturado/a faturar e ABC determinística.

O bloco financeiro gerencial protege DRE 1000 − 400 = 600, cancelados, mappings/unmapped, hierarquia e drill-down. Caixa cobre seleção/bloqueio de contas, saldo 10000 + 5000 − 3000 = 12000, vencidos trazidos para hoje sem mutação, quitados/cancelados, horizonte, caixa mínimo e primeira data negativa. O pgTAP correspondente valida as views quando a stack local estiver disponível.

A experiência gerencial testa meta, faltante, ritmo, dias úteis restantes, inadimplência, prioridades e famílias de alertas, concentração configurável, formatação pt-BR sem deslocar `DATE` e navegação por role. Estados loading/empty/error usam mecanismos do App Router; a verificação visual cobre desktop e mobile.
