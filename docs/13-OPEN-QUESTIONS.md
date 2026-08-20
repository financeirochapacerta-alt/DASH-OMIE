# Open questions / technical spikes

Não considerar os itens abaixo como regras até que evidência (documentação oficial atual, payload sanitizado e/ou teste) seja registrada.

| Tema | Evidência/saída esperada | Bloqueia |
|---|---|---|
| `ConsultarOS`, cancelamento e vencimento real de OS | Contratos e fixtures | Etapa 8 |
| Relação Pedido/OS ↔ títulos | Chaves, cardinalidade e exceções | Etapas 7–10 |
| Exclusões reais na Omie | Semântica por endpoint e tombstones | Sync confiável |
| Incremental/last-modified por endpoint | Matriz de suporte e limites | Etapas 4–8 |
| `codigo_dre`, `dadosDRE`, `ListarCadastroDRE` | Comparação com export real | Etapa 9 |
| Devoluções | Sinal, status, vínculo e impacto | Financeiro/DRE |
| Data real de baixa/recebimento | Campo, timezone e estornos | Caixa/DRE |
| Webhooks atuais | Eventos, assinatura, retry e limites | Otimização sync |

Também formalizar antes do uso: metas, carteira, inadimplência, resultado gerencial, caixa mínimo e Curva ABC.

Na Etapa 5, filtros incrementais foram confirmados na documentação para clientes e vendedores. Permanecem pendentes a semântica exata de inclusão/alteração em janelas sobrepostas e o suporte equivalente para categorias e contas correntes; até validação, estes dois módulos usam full listing.

Na Etapa 6, a documentação oficial confirmou filtros de inclusão/alteração para receber e pagar, mas não um filtro inequívoco de vencimento que represente a janela histórica/projetada. O fallback atual usa full listing e janela local por `data_vencimento`; cursores incrementais e janelas sobrepostas continuam pendentes de validação operacional.
