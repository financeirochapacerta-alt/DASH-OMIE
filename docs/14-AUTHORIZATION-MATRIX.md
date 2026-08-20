# Matriz de autorização V1

Autorização é aplicada no banco por RLS e novamente nas rotas server-side. Controles visuais apenas refletem essas decisões; nunca as substituem. Usuário inativo ou role ausente/desconhecida é negado.

| Área | ADMIN | DIRETORIA | FINANCEIRO | COMERCIAL | PRODUCAO | VIEWER |
|---|---|---|---|---|---|---|
| Dashboard liberado | leitura | leitura | leitura | leitura | leitura | leitura |
| Clientes/vendedores | leitura | leitura | leitura | leitura | leitura | — |
| Pedidos/OS | leitura | leitura | — | leitura | leitura | — |
| Financeiro/DRE | leitura | leitura | leitura | — | — | — |
| Analytics financeiro | leitura | leitura | leitura | — | — | — |
| Analytics comercial | leitura | leitura | — | leitura | — | — |
| Configurações | leitura/escrita | leitura limitada | leitura DRE | leitura de etapas | leitura de etapas | — |
| Perfis | leitura/escrita administrativa | — | — | — | — | próprio perfil |

Entidades sincronizadas não aceitam escrita de usuários. Somente ADMIN pode escrever em `stage_mappings`, `dre_category_mappings` e `management_settings`. RAW permanece exclusivo do backend. Analytics usa views `security_invoker`, portanto continua sujeito às policies das tabelas subjacentes.

Novos usuários recebem `VIEWER` e `is_active = false`; ativação e elevação são administrativas. Cadastro público fica desabilitado. O primeiro ADMIN deverá ser provisionado por procedimento administrativo server-side/SQL autorizado quando existir um projeto real.
