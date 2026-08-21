# Open questions / technical spikes

Não considerar os itens abaixo como regras até que evidência (documentação oficial atual, payload sanitizado e/ou teste) seja registrada.

| Tema | Evidência/saída esperada | Bloqueia |
|---|---|---|
| `ConsultarOS`, cancelamento e vencimento real de OS | Contratos e fixtures | Etapa 8 |
| Relação Pedido/OS ↔ títulos | Chaves, cardinalidade e exceções | Etapas 7–10 |
| Exclusões reais na Omie | Semântica por endpoint e tombstones | Sync confiável |
| Incremental/last-modified por endpoint | Matriz de suporte e limites | Etapas 4–8 |
| `ListarCadastroDRE` (árvore completa, níveis 1–2 nomeados) | Comparação com export real | Refinamento futuro da Etapa 9 |
| Data real de baixa/recebimento | Campo, timezone e estornos | Caixa/DRE |
| Webhooks atuais | Eventos, assinatura, retry e limites | Otimização sync |

Também formalizar antes do uso: metas, carteira, inadimplência, resultado gerencial, caixa mínimo e Curva ABC.

O bloqueio de implementação de OS foi reduzido: listagem e identidade `nCodOS` estão adotadas. Continuam abertas, sem inferência em produção, as semânticas operacionais de cancelamento e vencimento real de OS. A definição ABC 80/95 por faturamento é provisória e ainda requer validação de negócio.

Na Etapa 5, filtros incrementais foram confirmados na documentação para clientes e vendedores. Permanecem pendentes a semântica exata de inclusão/alteração em janelas sobrepostas e o suporte equivalente para categorias e contas correntes; até validação, estes dois módulos usam full listing.

Na Etapa 6, a documentação oficial confirmou filtros de inclusão/alteração para receber e pagar, mas não um filtro inequívoco de vencimento que represente a janela histórica/projetada. O fallback atual usa full listing e janela local por `data_vencimento`; cursores incrementais e janelas sobrepostas continuam pendentes de validação operacional.

A DRE inicial permanece explicitamente gerencial por vencimento. Competência estrita e data real de baixa seguem abertas. Os defaults técnicos de caixa mínimo (0) e horizonte (30 dias) precisam de validação de negócio antes da publicação executiva.

Validação real (Onda 2, 2026-08-21) contra dados sincronizados de produção:

- **`codigo_dre`/`dadosDRE` — confirmado e implementado.** `ListarCategorias` retorna `dadosDRE` para toda categoria (143/143 no dataset real) com a forma `{codigoDRE, descricaoDRE, naoExibirDRE, nivelDRE, sinalDRE, totalizaDRE}`; no dataset real, `nivelDRE` é sempre `3`, `naoExibirDRE`/`totalizaDRE` sempre `"N"`, e `codigoDRE` é sempre um código de 3 segmentos numéricos. 80/143 categorias reais têm `codigoDRE` preenchido. Aprovado e implementado o seed automático de `dre_category_mappings` a partir desses campos (`source = 'omie'`), com `source = 'manual'` sempre preservado e priorizado — ver detalhes e algoritmo em [05-DRE.md](05-DRE.md) e [DECISIONS.md](DECISIONS.md) ADR-018. Validado com dados reais: total assinado de julho/2026 idêntico antes/depois (R$ 43.634,35), classificação idempotente. O que **continua aberto**: a Omie não nomeia os níveis 1–2 (tipo/grupo) em `dadosDRE`, só o nível 3 (`descricaoDRE`); `dre_type`/`dre_group` usam os segmentos do código, não um nome — `ListarCadastroDRE` (árvore completa) não foi chamado e poderia trazer os nomes dos níveis superiores no futuro.
- **Devoluções — confirmado, sem regra especial necessária.** 9 categorias reais dedicadas existem (`Devoluções`, `Devoluções de Vendas`, `Devoluções de Compra de Mercadoria de Revenda`, etc.). Uma devolução é um título comum (`accounts_receivable`/`accounts_payable`) vinculado a uma dessas categorias — sinal, status e cancelamento seguem exatamente as mesmas regras de qualquer título, e agora também recebem classificação DRE automática como qualquer outra categoria com `codigoDRE`.
- **Data real de baixa — continua aberto.** Confirmado por inspeção do payload bruto real de `ListarContasReceber`/`ListarContasPagar` que o endpoint de listagem não traz nenhum campo de data de baixa/recebimento efetivo (campos disponíveis: `data_emissao`, `data_previsao`, `data_registro`, `data_vencimento`). Exigiria chamada de detalhe por título (`ConsultarContaReceber`/`ConsultarContaPagar`), fora do escopo atual.
