# Identidade visual — Chapa Certa

Coloque aqui os dois arquivos oficiais da marca, exatamente com estes nomes:

- `logo-preto.svg` (ou `.png`) — versão preta, para uso em fundos claros (topbar, telas de conteúdo).
- `logo-branco.svg` (ou `.png`) — versão branca, para uso em fundos escuros (sidebar, tela de login).

Preferir SVG (escala sem perda). Se só houver PNG, usar a maior resolução disponível.

Não redesenhar, não alterar proporção/tipografia/transparência da marca.

Assim que os arquivos estiverem aqui, atualizar:

- `src/components/management/app-shell.tsx` — sidebar (`.brand-placeholder` hoje é só o texto "CC"; trocar por `<Image src="/branding/logo-branco.svg" .../>`).
- `src/app/(management)/layout.tsx` — tela de perfil inativo (mesmo padrão, fundo escuro).
- `src/app/login/page.tsx` / `src/features/auth/login-form.tsx` — tela de login (fundo claro → logo preta).
- Dashboard Executivo, se fizer sentido visualmente.
- `src/app/layout.tsx` ou `app/icon.*` — favicon, se houver uma versão quadrada/simplificada da marca.

Até lá, o app usa um placeholder textual ("CC") no lugar da logo — não é um dado real sendo confundido com fixture, é só um espaço reservado de UI.
