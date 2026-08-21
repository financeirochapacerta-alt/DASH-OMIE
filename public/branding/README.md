# Identidade visual — Chapa Certa

Arquivos oficiais da marca (lockup completo: ícone + "CHAPA CERTA" + tagline), fornecidos pela Chapa Certa:

- `logo-chapa-certa-fundo-claro.png` — versão para uso em superfícies claras (login, estados institucionais, header no mobile).
- `logo-chapa-certa-fundo-escuro.png` — versão para uso em superfícies escuras (sidebar).

Os dois arquivos têm fundo opaco (sem canal alfa) já ajustado à respectiva superfície — por isso a escolha certa é sempre pela cor de fundo de onde a logo será exibida, nunca por preferência visual pontual.

Não redesenhar, não recolorir e não alterar a proporção da marca. Ao redimensionar, sempre preservar a razão largura/altura original (`width`/`height` do `next/image` devem manter a proporção do arquivo fonte).

Aplicada em:

- `src/app/login/page.tsx` — tela de login (fundo claro → `logo-chapa-certa-fundo-claro.png`).
- `src/app/(management)/layout.tsx` — tela de perfil inativo (fundo claro, mesmo padrão do login).
- `src/app/not-found.tsx` — estado institucional "página não encontrada" (fundo claro, mesmo padrão do login).
- `src/components/management/app-shell.tsx` — sidebar (fundo escuro → `logo-chapa-certa-fundo-escuro.png`) e topbar mobile (fundo claro → `logo-chapa-certa-fundo-claro.png`, visível apenas em telas ≤760px, quando a sidebar fica oculta).

Não aplicada no conteúdo do Dashboard Executivo em si: a página já herda a identidade via `AppShell` (sidebar sempre visível + logo no topbar mobile), então repetir a marca dentro do conteúdo da página seria decorativo redundante.

O placeholder textual "CC" foi removido de todos os locais acima.
