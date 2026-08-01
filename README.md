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
└── locales/        # pt-BR.json, en.json, es.json
```
