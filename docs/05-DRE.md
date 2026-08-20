# DRE gerencial

## Estrutura alvo

`Tipo → Grupo → Conta DRE → Categoria`, com visão mensal, acumulada, comparativos e drill-down até lançamentos auditáveis.

## Princípios

- Cancelados não inflam DRE.
- Classificação deve ser reproduzível, versionada e rastreável à categoria/origem.
- Não duplicar manualmente a lógica do sistema anterior sem investigar suporte nativo atual da Omie.

## Spike obrigatório

Validar `codigo_dre`, `dadosDRE`, `ListarCadastroDRE` e demais estruturas atuais; comparar com export real da DRE Omie; documentar cobertura, estabilidade e lacunas. Só então decidir entre classificação nativa, mapeamento complementar ou híbrido.

