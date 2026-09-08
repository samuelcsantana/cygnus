# Ninho

[![Latest release](https://img.shields.io/github/v/release/samuelcsantana/cygnus?label=release)](https://github.com/samuelcsantana/cygnus/releases/latest)
[![CI](https://github.com/samuelcsantana/cygnus/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/samuelcsantana/cygnus/actions/workflows/ci.yml)
[![Storybook deployment](https://github.com/samuelcsantana/cygnus/actions/workflows/storybook.yml/badge.svg?branch=main)](https://samuelcsantana.github.io/cygnus/)
[![MIT License](https://img.shields.io/github/license/samuelcsantana/cygnus)](LICENSE)

![React 19](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)
![TypeScript strict](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Vite 8](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)

Aplicação web mobile-first para famílias acompanharem a saúde e o desenvolvimento dos filhos. **Ninho** é o nome do produto; **Cygnus** identifica este repositório e suas integrações.

[Aplicação](https://cygnus.samuelsantana.dev) · [Design system](https://samuelcsantana.github.io/cygnus/) · [Backend](https://github.com/samuelcsantana/cygnus-api) · [Licença MIT](LICENSE)

## Recursos

- Cadastro, login com senha ou Google e recuperação de acesso.
- Perfis de crianças e compartilhamento com responsáveis.
- Calendário de vacinas, consultas, medicamentos e agenda de profissionais.
- Medidas de crescimento, referências da OMS e marcos de desenvolvimento.
- Planos de saúde, busca e notificações.
- Termos de Uso, Política de Privacidade e registro de aceite.
- Português, inglês e espanhol; temas claro e escuro.

O Ninho organiza informações e não substitui orientação de profissionais de saúde. A versão web depende da API para os dados da família. O cache da aplicação não oferece armazenamento offline completo desses registros.

## Stack

React 19, Vite 8 e TypeScript estrito; TanStack Query para estado do servidor; React Hook Form e Zod para formulários; Zustand para estado compartilhado de interface; Tailwind CSS v4, shadcn/ui e Radix; i18next para idiomas.

Vitest, Testing Library e MSW cobrem testes de aplicação. Storybook documenta componentes e verifica interações e acessibilidade. Playwright cobre jornadas no navegador.

## Desenvolvimento local

Use Node.js 24 e npm. Inicie o backend separado, normalmente em `http://localhost:3005`, seguindo as instruções do [cygnus-api](https://github.com/samuelcsantana/cygnus-api).

```bash
npm ci
npm run dev
```

Frontend em `http://localhost:4205`. Para configurar a API, crie um arquivo `.env.local` com `VITE_API_BASE_URL`. Variáveis `VITE_*` são públicas e incorporadas durante o build: nunca coloque segredos nelas. As credenciais do Google pertencem ao backend.

### Docker

```bash
docker compose up -d --build web
```

O Nginx serve o build estático na porta 4205, sem recarga automática do código. Reconstrua o serviço após alterações. Docker e Vite usam a mesma porta: execute apenas um deles nela. O Compose não inicia o backend; configure `VITE_API_BASE_URL` como argumento de build quando necessário.

## Validação

| Comando | Finalidade |
| --- | --- |
| `npm run lint` | Lint com oxlint |
| `npx tsc -b` | Typecheck da aplicação, stories e integrações |
| `npm test` | Testes unitários e de componentes |
| `npm run contract:check` | Contratos dos endpoints mapeados contra o OpenAPI |
| `npm run test:storybook` | Stories, interações e axe em Chromium |
| `npm run test:e2e` | Jornadas Playwright com os serviços já iniciados |
| `npm run build` | Typecheck, aplicação, embed e Module Federation |
| `npm run storybook` | Design system na porta 6006 |
| `npm run build-storybook` | Design system estático em `storybook-static/` |
| `npm run preview` | Visualização local do build |

Instale o navegador dos testes com `npx playwright install chromium`. Consulte [as instruções de E2E](e2e/README.md) antes de executar testes que criam dados.

O CI verifica lint, tipos, contratos, testes unitários, build e Storybook. E2E é uma execução separada. O verificador de contratos cobre um mapa explícito de endpoints; axe não substitui uma avaliação manual de acessibilidade.

## Estrutura e design system

| Diretório | Responsabilidade |
| --- | --- |
| `src/app/` | Rotas, providers e layouts |
| `src/features/` | Domínios, APIs, schemas, hooks e páginas |
| `src/components/ui/` | Primitivos de interface |
| `src/shared/`, `src/hooks/`, `src/lib/` | Componentes e infraestrutura reutilizáveis |
| `src/locales/` | Textos em pt-BR, inglês e espanhol |
| `src/docs/` | Páginas do Storybook |
| `e2e/` | Jornadas Playwright e fixtures |

Os tokens visuais ficam em `src/index.css`. Stories ficam ao lado dos componentes; a configuração está em `.storybook/`. A suíte trata violações de acessibilidade como erros. O workflow `storybook.yml` publica o design system no GitHub Pages a partir da `main`.

## Build e publicação

Três artefatos compartilham o build de produção:

| Artefato | Entrada pública | Documentação |
| --- | --- | --- |
| Aplicação React | `/` | Este README |
| Widget independente | `/embed/embed.js`, `/embed/iframe.html` | [Embed](embed/README.md) |
| Module Federation | `/mf/remoteEntry.js` | [Module Federation](mf/README.md) |

Preserve os endereços e identificadores técnicos Cygnus usados por consumidores externos. Entradas estáveis precisam de cache curto ou revalidação; arquivos com hash podem usar cache imutável.

A configuração Vercel encaminha `/api/*` e `/uploads/*` ao backend no Render. Alterações na `main` acionam publicação. Docker usa Nginx, com configuração própria de cabeçalhos e cache. Para verificar o servidor estático após mudanças:

```bash
node scripts/check-static-serving.mjs
node scripts/check-static-serving.mjs --browser
```

Use `STATIC_BASE_URL` para outro destino. A segunda verificação precisa de Chromium e acesso à API.

## Termos e privacidade

Os documentos estão disponíveis nas rotas [Termos de Uso](https://cygnus.samuelsantana.dev/termos) e [Política de Privacidade](https://cygnus.samuelsantana.dev/privacidade). Os textos ficam em `src/features/legal/content/`; versão, status e vigência em `src/shared/legal.ts`. Alterações locais passam a aparecer no site após publicação.

O aplicativo Android com dados locais tem planejamento separado e não é entregue por este repositório.

## Licença e contato

Código distribuído sob a [licença MIT](LICENSE), copyright © 2026 Samuel Santana. Dependências e materiais de terceiros permanecem sujeitos às respectivas licenças.

Responsável: Samuel Santana — [samuel.ssa89@gmail.com](mailto:samuel.ssa89@gmail.com).
