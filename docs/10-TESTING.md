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
