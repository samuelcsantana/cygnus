# Prontidão para Produção — Meu Neném

Checklist vivo do que falta antes de um lançamento real. Gerado após a implementação inicial completa (auth, babies, vaccines, appointments, milestones, notifications) contra o `cygnus-api` real. Atualize os checkboxes conforme os itens forem resolvidos.

## Nota de arquitetura (contexto para a próxima sessão)

Duas reconstruções grandes de UX aconteceram depois da versão inicial deste
checklist — vale ler antes de mexer em navegação ou nas telas de conteúdo:

1. **Navegação no topo + sem seleção obrigatória de filho.** A sidebar
   esquerda (`SidebarBabySwitcher`) e o Zustand `selectedBaby.store.ts` foram
   removidos por completo. A navegação agora é uma barra no topo
   (`AppShellLayout.tsx`); cada aba mostra a família inteira de uma vez, e
   "qual filho" só é perguntado dentro dos diálogos de cadastro
   (`BabyPickerStep`, some sozinho quando só há um filho).
2. **Dashboard, Vacinas, Consultas e Marcos viraram visões únicas
   entre-filhos.** Em vez de repetir uma seção completa por filho, cada tela
   mostra uma lista/timeline/grid única, ordenada globalmente (urgência,
   data etc.), com cada item marcado por um avatarzinho colorido do filho
   (`babyAvatarAppearance`/`babyInitials`, em `shared/utils/babyAvatarColor.ts`).

Ao investigar esse trabalho, foi encontrado e corrigido no `cygnus-api` um bug
de contrato: o campo `specialty` de `Appointment` tinha migration, lista de
sugestões e formulário no frontend, mas nunca foi ligado no domínio/use
cases/repositório/schemas de rota do backend — criar uma consulta com
especialidade preenchida quebrava com 500 e depois falha de validação Zod na
resposta. Corrigido de ponta a ponta (ver `cygnus-api/PLANO.md`, Fase 9).

## 🔴 Bloqueadores

- [x] **Sessão expira em 15 min sem refresh** — `cygnus-api` agora expõe `POST /auth/refresh` (rotaciona `access_token`/`refresh_token` via cookie HTTP-only). Frontend tenta um silent-refresh automático em qualquer 401 (exceto `/auth/login` e o próprio `/auth/refresh`) antes de redirecionar pro login — ver `src/lib/http-client.ts`.
- [x] **Sem `/auth/me`** — `cygnus-api` agora expõe `GET /auth/me`. Frontend consome via `useSyncAuthIdentity` (`src/features/auth/api/auth.hooks.ts`), montado no `ProtectedLayout`, que também substitui `GET /babies` como probe de sessão. Nome real agora sobrevive a um F5.
- [x] **Notificações nunca confirmadas ponta a ponta** — causa raiz encontrada: o job repetível do BullMQ (`reminder-queue.ts`) usava `repeat: { pattern: '0 8 * * *' }` sem `immediately: true`, então só rodava na próxima ocorrência do cron (8h), nunca ao subir o servidor — em qualquer sessão de teste manual fora desse horário, `GET /notifications` ficava vazio mesmo com vacina atrasada de verdade no banco. Corrigido adicionando `immediately: true`; validado localmente (log `reminders.generated` dispara na subida).
- [ ] **Sem HTTPS/TLS e CORS de produção** — `nginx.conf` só escuta :80; `.env.production` com URL vazia (placeholder proposital). Depende de domínio registrado + infra.
- [ ] **Sem política de privacidade, termos ou consentimento** — app lida com dado de saúde infantil (vacinas, alergias). Necessário para LGPD. Conteúdo jurídico não pode ser fabricado pela IA — precisa de revisão humana/jurídica.
- [x] **Zero observabilidade em produção** — Error Boundary global + `@sentry/react` plugado (`src/lib/error-reporting.ts`), mas segue como no-op até existir um projeto Sentry real e `VITE_SENTRY_DSN` ser preenchido em `.env.production`.
- [x] **Sem CI** — `.github/workflows/ci.yml` roda lint/typecheck/test/build em push e PR pra `main`.

## 🟡 Importante (dá pra lançar em beta fechado sem isso)

- [x] Editar perfil do bebê — ícone de lápis no `BabyCard` abre `EditBabyDialog`, PATCH completo (`src/features/babies/`)
- [x] Excluir perfil do bebê — `cygnus-api` agora expõe `DELETE /babies/{id}` (cascata para vacinas/consultas/marcos/notificações). `EditBabyDialog` ganhou uma ação destrutiva com confirmação (`AlertDialog`, mesmo padrão do cancelamento de consulta)
- [x] Editar marco — ícone de lápis em cada card do `MilestoneTimeline` abre `EditMilestoneDialog`, PATCH completo (`src/features/milestones/`)
- [x] Confirmação antes de ação destrutiva — "Cancelar Consulta" agora abre um `AlertDialog` (shadcn) de confirmação antes de fazer o PATCH (`AppointmentDetailDialog.tsx`)
- [x] Seletor de idioma na UI — `LanguageSwitcher` (`src/shared/components/`) no header do app (mobile e desktop) e na tela de login/registro; `i18n.changeLanguage()` já persiste em `localStorage` (`i18nextLng`) via `i18next-browser-languagedetector`
- [x] Testes E2E (Playwright) das jornadas críticas — `e2e/` cobre as 4 jornadas citadas no CLAUDE.md Seção 10 (registrar+login, adicionar bebê, registrar vacina aplicada, agendar consulta), rodando contra o stack Docker real dos dois repos (`npm run test:e2e`, ver `e2e/README.md`). **Não está no CI** ainda — exigiria checkout do `cygnus-api` (repo separado/privado) + Postgres/Redis no runner; fica como próximo passo se quiser automatizar
- [x] Error Boundary — `src/app/ErrorBoundary.tsx` + `ErrorFallback.tsx` envolvendo o router em `App.tsx`
- [x] Avatar Dicebear depende de serviço externo não controlado — trocado `https://api.dicebear.com/...` por geração local com `@dicebear/core` + `@dicebear/collection` (`shared/utils/defaultAvatar.ts`), mesmo estilo "avataaars", zero chamada de rede em produção
- [x] Bundle único ~721KB sem code-splitting — rotas convertidas pra `lazy` do React Router (`router.tsx`); chunk principal caiu pra ~272KB (gzip 85KB), resto carrega sob demanda. Validado com a suíte Playwright completa contra o build real
- [x] Seleção de bebê não persiste entre sessões — resolvido de raiz: não existe mais um "bebê selecionado" global (`selectedBaby.store.ts` foi removido na reconstrução de navegação, ver nota de arquitetura abaixo), então não há nada pra persistir nem vazar entre contas
- [x] Página 404 real — `NotFoundRoute` (`src/app/routes/`) substitui o redirect silencioso no catch-all do router

## 🟢 Polish (não bloqueia nada)

- [x] Skeletons em vez de spinner genérico — `VaccineCalendarSkeleton`, `AppointmentsSkeleton`, `MilestoneTimelineSkeleton` substituem o spinner nas 3 listas (Vacinas/Consultas/Marcos); o spinner de boot do `ProtectedLayout` ficou como está de propósito (é checagem de sessão, não lista de conteúdo)
- [ ] Upload de foto real pra marcos (hoje só URL colada; backend também não tem storage)
- [ ] Imprimir/exportar carteira de vacinação
- [ ] PWA / instalar na tela inicial
- [ ] Busca/filtro e paginação nas listas
- [x] Auditoria automatizada de acessibilidade — `@axe-core/playwright` roda WCAG 2 A/AA em login, registro e nas páginas autenticadas principais (`e2e/accessibility.spec.ts`). Achou e corrigiu 2 problemas reais e sistêmicos de contraste: `text-slate-400` usado como texto de verdade (rótulos, dicas, timestamps) em vez de só ícone, e `amber-500` (texto/fundo) na tela de Marcos — ambos ficavam abaixo de 4.5:1. **Detalhe de tooling:** a animação `animate-fade-in-up` precisa ser desabilitada antes do scan (`page.addStyleTag`), senão o axe captura o DOM no meio da transição de opacidade e reporta falsos positivos em cascata
- [ ] Analytics de uso

## Ordem de execução combinada

1. Error Boundary + Sentry (plumbing pronta, aguardando DSN real)
2. CI básico (GitHub Actions: typecheck + lint + test + build)
3. Editar/excluir perfil do bebê
4. Política de privacidade / termos / consentimento (scaffolding técnico; conteúdo jurídico marcado como placeholder até revisão humana)
5. ~~Investigar notificações com o time de backend~~ — feito: causa raiz era agendamento do BullMQ, corrigido em `cygnus-api`.
6. ~~`/auth/refresh` e `/auth/me`~~ — feito nos dois repos (`cygnus-api` + `cygnus`), com testes de integração/unitários novos.

Itens sem checkbox marcado seguem em aberto. Marque conforme forem resolvidos.
