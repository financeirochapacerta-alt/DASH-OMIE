# DRE gerencial

## Estrutura alvo

`Tipo → Grupo → Conta DRE → Categoria`, com visão mensal, acumulada, comparativos e drill-down até lançamentos auditáveis.

## Princípios

- Cancelados não inflam DRE.
- Classificação deve ser reproduzível, versionada e rastreável à categoria/origem.
- Não duplicar manualmente a lógica do sistema anterior sem investigar suporte nativo atual da Omie.
- A camada financeira fornece despesas com sinal negativo e exclui títulos cancelados; a DRE futura deve consumir essa convenção sem reinverter valores.

## Spike obrigatório

Validar `codigo_dre`, `dadosDRE`, `ListarCadastroDRE` e demais estruturas atuais; comparar com export real da DRE Omie; documentar cobertura, estabilidade e lacunas. Só então decidir entre classificação nativa, mapeamento complementar ou híbrido.

Confirmado com dados reais (Onda 2, 2026-08-21, 143 categorias sincronizadas): `ListarCategorias` retorna `dadosDRE` para toda categoria, na forma `{codigoDRE, descricaoDRE, sinalDRE, nivelDRE, totalizaDRE, naoExibirDRE}`. No dataset real, `nivelDRE` é sempre `3`, `totalizaDRE` e `naoExibirDRE` são sempre `"N"` (nenhum totalizador/oculto observado ainda) e `codigoDRE`, quando presente, é sempre um código numérico de 3 segmentos (`X.YY.ZZ`, ex. `2.11.01`). 80/143 categorias reais têm `codigoDRE` preenchido; 63 não têm nenhum. `ListarCadastroDRE` (endpoint dedicado à árvore completa da DRE) ainda não foi chamado — a Omie não expõe um relatório DRE pronto para diff via `ListarContasReceber`/`ListarContasPagar`.

## Classificação automática a partir da Omie

`deriveDreMappingFromOmie` (`src/services/omie/reference-data/dre-mapping.ts`) e `syncDreMappingsFromOmie` (`.../dre-mapping-sync.ts`, executado via `npm run sync:dre-mappings`) implementam a classificação automática, com base **apenas** nos campos confirmados acima:

- `dre_type` = primeiro segmento de `codigoDRE` (ex. `"2"`).
- `dre_group` = dois primeiros segmentos (ex. `"2.11"`).
- `dre_account` = `descricaoDRE` (único label textual que a Omie realmente fornece; é 1:1 com `codigoDRE` em todo o dataset observado).
- `sign_behavior` = `sinalDRE`, preservado como metadado descritivo — nunca usado para recalcular ou reinverter `signed_value`.

A Omie não nomeia os níveis 1 e 2 (tipo/grupo) — usar os segmentos do código, não um nome inventado, mantém a classificação auditável e reversível a partir de `categories.codigo_dre`/`categories.dre_metadata`. Categoria sem `codigoDRE` ou sem `descricaoDRE`, ou com um `codigoDRE` fora do formato de 3 segmentos confirmado, permanece `unmapped` — nada é inferido por nome de categoria.

Origem e sobreposição: cada mapping tem `source` (`omie` ou `manual`). O sync automático só escreve/atualiza linhas `source = 'omie'` e nunca lê nem sobrescreve uma linha `source = 'manual'` da mesma categoria. Quando ambas existem para a mesma categoria, `analytics.dre_details` prioriza explicitamente `manual` sobre `omie` (independente das colunas de ordenação). A sincronização é idempotente: categoria nova classificável → insere; metadata Omie igual → inalterado; metadata Omie mudou → atualiza; categoria sem metadata suficiente → permanece `unmapped`.

Validado em dados reais: rodar a classificação duas vezes seguidas produz 0 inserções/atualizações na segunda vez (idempotência confirmada); o total assinado de julho/2026 permaneceu exatamente R$ 43.634,35 antes e depois da classificação — a distribuição por Tipo/Grupo/Conta mudou, o resultado consolidado não.

## Motor inicial

O motor usa vencimento como aproximação gerencial e a hierarquia `Tipo → Grupo → Conta DRE → Categoria`. `dre_category_mappings` define classificação, origem e ordem estável; quando houver mais de um mapping ativo, a seleção é determinística pela ordem e origem. Categorias não mapeadas permanecem em `unmapped`, com título e valor acessíveis no drill-down. Mensal e acumulado usam `signed_value`; portanto 1000 de receita e 400 de despesa resultam em 600.
