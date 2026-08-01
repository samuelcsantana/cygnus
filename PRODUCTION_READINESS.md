# Prontidão para Produção — Meu Neném

Checklist vivo do que falta antes de um lançamento real. Gerado após a implementação inicial completa (auth, babies, vaccines, appointments, milestones, notifications) contra o `cygnus-api` real. Atualize os checkboxes conforme os itens forem resolvidos.

## 🔴 Bloqueadores

- [ ] **Sessão expira em 15 min sem refresh** — `cygnus-api` não expõe `/auth/refresh`. Depende do backend. Paliativo possível: aviso de expiração iminente no frontend.
- [ ] **Sem `/auth/me`** — identidade (nome) se perde a cada F5, cai pro e-mail cru. Depende do backend.
- [ ] **Notificações nunca confirmadas ponta a ponta** — `GET /notifications` sempre voltou vazio nos testes, mesmo com vacinas atrasadas. Precisa investigação/confirmação com o time de backend antes de anunciar a feature.
- [ ] **Sem HTTPS/TLS e CORS de produção** — `nginx.conf` só escuta :80; `.env.production` com URL vazia (placeholder proposital). Depende de domínio registrado + infra.
- [ ] **Sem política de privacidade, termos ou consentimento** — app lida com dado de saúde infantil (vacinas, alergias). Necessário para LGPD. Conteúdo jurídico não pode ser fabricado pela IA — precisa de revisão humana/jurídica.
- [x] **Zero observabilidade em produção** — Error Boundary global + `@sentry/react` plugado (`src/lib/error-reporting.ts`), mas segue como no-op até existir um projeto Sentry real e `VITE_SENTRY_DSN` ser preenchido em `.env.production`.
- [x] **Sem CI** — `.github/workflows/ci.yml` roda lint/typecheck/test/build em push e PR pra `main`.

## 🟡 Importante (dá pra lançar em beta fechado sem isso)

- [x] Editar perfil do bebê — ícone de lápis no `BabyCard` abre `EditBabyDialog`, PATCH completo (`src/features/babies/`). **Excluir segue impossível**: não existe `DELETE /babies/{id}` no contrato da API — precisa entrar como pedido pro backend
- [ ] Editar marco (`PATCH` existe na API, sem UI)
- [ ] Confirmação antes de ação destrutiva (ex: "Cancelar Consulta" executa na hora)
- [ ] Seletor de idioma na UI (3 idiomas funcionam, só troca via localStorage manual)
- [ ] Testes E2E (Playwright) das jornadas críticas — CLAUDE.md Seção 10 pede isso explicitamente
- [x] Error Boundary — `src/app/ErrorBoundary.tsx` + `ErrorFallback.tsx` envolvendo o router em `App.tsx`
- [ ] Avatar Dicebear depende de serviço externo não controlado (`api.dicebear.com`)
- [ ] Bundle único ~721KB sem code-splitting (Vite já avisa no build)
- [ ] Seleção de bebê não persiste entre sessões (Zustand sem `persist`)
- [ ] Página 404 real (hoje redireciona silenciosamente pra `/`)

## 🟢 Polish (não bloqueia nada)

- [ ] Skeletons em vez de spinner genérico
- [ ] Upload de foto real pra marcos (hoje só URL colada; backend também não tem storage)
- [ ] Imprimir/exportar carteira de vacinação
- [ ] PWA / instalar na tela inicial
- [ ] Busca/filtro e paginação nas listas
- [ ] Auditoria automatizada de acessibilidade (axe/jest-axe)
- [ ] Analytics de uso

## Ordem de execução combinada

1. Error Boundary + Sentry (plumbing pronta, aguardando DSN real)
2. CI básico (GitHub Actions: typecheck + lint + test + build)
3. Editar/excluir perfil do bebê
4. Política de privacidade / termos / consentimento (scaffolding técnico; conteúdo jurídico marcado como placeholder até revisão humana)
5. Investigar notificações com o time de backend (não implementável só a partir deste repo)

Itens sem checkbox marcado seguem em aberto. Marque conforme forem resolvidos.
