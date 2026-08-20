# Instruções permanentes para agentes

## Recuperação de contexto

1. Leia primeiro `docs/00-PROJECT-MASTER.md`, que é o índice condensado.
2. Abra somente os documentos especializados exigidos pela tarefa.
3. Não dependa do histórico do chat nem reexplique decisões registradas.
4. Se uma decisão mudar, atualize a documentação afetada e `docs/DECISIONS.md`.
5. Evite duplicação: mantenha a fonte detalhada em um documento e use links nos demais.

## Execução

- Determine pelo código, documentação e testes tudo que puder antes de perguntar.
- Não peça confirmação para decisões já documentadas; corrija autonomamente problemas reversíveis.
- Teste proporcionalmente ao risco; “compilou” não significa “funciona”.
- Não altere regras financeiras silenciosamente. Preserve dados originais para auditoria.
- Nunca exponha secrets nem envie credenciais Omie ao navegador, repositório ou logs públicos.
- Não adote dependência paga quando houver alternativa gratuita adequada.
- Não execute ação destrutiva/irreversível, deploy ou push sem autorização.
- Faça mudanças pequenas e semanticamente claras; preserve alterações do usuário.
- Atualize documentação e testes quando comportamento ou decisão mudar.

## Escalonamento

Só escale por: credencial necessária; ação destrutiva/irreversível; potencial custo; decisão de negócio realmente ambígua; ou bloqueio externo incontornável.

## Antes de concluir

Execute testes e verificações aplicáveis, revise consistência documental, confira `git diff`/`git status` e informe objetivamente resultado e pendências.

