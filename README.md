# Meu Neném

Frontend React (Vite + TypeScript) do "Meu Neném" — app mobile-first que ajuda pais a acompanhar a saúde e o desenvolvimento dos filhos (vacinas, consultas e marcos de desenvolvimento).

Consome a API `cygnus-api` (backend separado). Veja `CLAUDE.md` para as convenções completas de arquitetura, estilo e commits deste repositório.

## Stack

- Vite + React 19 + TypeScript (strict)
- TanStack Query (estado de servidor) + Zustand (estado de UI compartilhado, uso pontual)
- React Hook Form + Zod (formulários e validação)
- Tailwind CSS v4 + shadcn/ui (Radix)
- react-i18next (pt-BR padrão, en e es)
- Vitest + Testing Library + MSW (testes)
- Storybook 10 (design system documentado, testado e publicado)

## Rodando localmente

Pré-requisito: o backend `cygnus-api` precisa estar acessível (por padrão em `http://localhost:3005`, configurável via `.env`).

```bash
npm install
npm run dev
```

Abre em `http://localhost:4205`.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento (porta 4205) |
| `npm run build` | Typecheck + build de produção (`dist/`) |
| `npm run preview` | Serve o build de produção localmente |
| `npm run lint` | Lint (oxlint) |
| `npm run test` | Testes (Vitest) |
| `npm run test:watch` | Testes em modo watch |
| `npm run storybook` | Storybook em modo dev (porta 6006) |
| `npm run build-storybook` | Build estático do Storybook (`storybook-static/`) |
| `npm run test:storybook` | Roda cada story como teste (interação + acessibilidade) |

## Design System (Storybook)

📖 **[Ver o design system publicado →](https://samuelcsantana.github.io/cygnus/)**

Documentação viva dos 17 primitivos em `src/components/ui` e dos componentes compostos em
`src/shared/components`, com página de design tokens (cores, tipografia, raios) gerada a partir do
mesmo `@theme` que o app usa.

Não é vitrine: é parte da suíte de testes.

- **Acessibilidade** — o axe roda em cada story a cada build, e `parameters.a11y.test = 'error'`
  transforma violação em falha, não em aviso. As exceções conhecidas (três pares de token abaixo de
  AA, anteriores ao Storybook) estão enumeradas uma a uma em `src/test/a11y-known-issues.ts` e
  rastreadas no `GAPS.md` — nenhuma é silenciosa.
- **Interação** — stories com `play` são testes de verdade: abrem diálogos, navegam por teclado,
  digitam em campos e verificam o resultado. Rodam headless no CI, então regressão de foco ou de
  navegação por teclado quebra o build.
- **Estados** — carregando, erro, vazio e desabilitado são stories de primeira classe, não algo que
  cada tela improvisa.

```bash
npm run storybook                 # dev server em :6006
npx playwright install chromium   # uma vez, para a suíte de testes
npm run test:storybook            # cada story como teste
```

O deploy para GitHub Pages acontece a cada push na `main` (`.github/workflows/storybook.yml`), que
liga o Pages sozinho na primeira execução — não é preciso mexer em Settings.

## Docker

```bash
docker compose up -d --build
```

Sobe o build de produção servido por Nginx em `http://localhost:4205`. O compose não define um serviço para o backend — aponte `VITE_API_BASE_URL` (build arg) para onde o `cygnus-api` estiver rodando.

## Estrutura

```
src/
├── app/            # Router, providers raiz, layouts (shell autenticado, rota protegida)
├── components/ui/  # Componentes shadcn/ui (gerados via CLI, sem lógica de negócio)
├── shared/         # Componentes/hooks/utils reutilizáveis entre features
├── features/       # auth, babies, vaccines, appointments, milestones, notifications
│   └── <feature>/
│       ├── api/        # fetch + hooks TanStack Query + schemas Zod
│       ├── components/ # componentes de apresentação
│       └── routes/     # páginas roteadas
├── lib/            # cliente HTTP, config, i18n, query client, utilitários de data
├── hooks/          # hooks reutilizáveis entre features
├── docs/           # páginas MDX do Storybook (introdução, design tokens)
└── locales/        # pt-BR.json, en.json, es.json
```

As stories ficam ao lado do componente que documentam (`button.tsx` → `button.stories.tsx`), e a
configuração do Storybook em `.storybook/`.
