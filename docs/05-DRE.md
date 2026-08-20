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

## Motor inicial

O motor usa vencimento como aproximação gerencial e a hierarquia `Tipo → Grupo → Conta DRE → Categoria`. `dre_category_mappings` define classificação, origem e ordem estável; quando houver mais de um mapping ativo, a seleção é determinística pela ordem e origem. Categorias não mapeadas permanecem em `unmapped`, com título e valor acessíveis no drill-down. Mensal e acumulado usam `signed_value`; portanto 1000 de receita e 400 de despesa resultam em 600.
