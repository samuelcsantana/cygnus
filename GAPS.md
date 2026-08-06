# Análise de Gaps — Meu Neném

Levantamento temático (Design, Acessibilidade, Usabilidade, Segurança, Praticidade) feito em 2026-08-11, cobrindo o frontend (`cygnus`) e o backend (`cygnus-api`) via leitura direta de código nos dois repositórios, `npm audit` e conferência cruzada do que o frontend consome contra o que o backend expõe.

**Status:** a maior parte dos itens foi implementada em 2026-08-11 (mesmo dia do levantamento). Dois itens de escopo grande foram deliberadamente deixados de fora desta rodada por decisão explícita (ver seção final) e permanecem em aberto.

**Relação com `PRODUCTION_READINESS.md`:** aquele checklist já existente continua sendo a lista operacional principal (bloqueadores conhecidos: HTTPS/TLS, política de privacidade/consentimento). Este documento é um corte mais profundo e temático — **evita repetir itens já marcados `[x]` lá** e foca em gaps novos encontrados nesta análise. Os dois devem ser lidos em conjunto.

Severidade usa a mesma escala do checklist existente:
- 🔴 **Bloqueador** — não lança sem isso.
- 🟡 **Importante** — dá pra lançar em beta fechado sem isso, mas precisa vir logo depois.
- 🟢 **Polish** — não bloqueia nada.

---

## 🔐 Segurança & Privacidade

- [x] 🟡 **Rate limiting único e global (100 req/min) sem limite reforçado em auth** — `/auth/register`, `/auth/login` e `/auth/refresh` agora têm `config: { rateLimit: AUTH_RATE_LIMIT }` (10 req/min por IP), além do limite global de 100/min (`cygnus-api/src/presentation/http/routes/auth.routes.ts`).
- [x] 🟡 **Refresh token não é revogado no logout nem tem detecção de reuso** — denylist em Redis (`RedisTokenRevocationService`, chave `revoked-refresh:{jti}`, TTL = vida restante do token). Logout e `DELETE /users/me` revogam o refresh token atual; `RefreshUserSessionUseCase` revoga o token gasto a cada rotação (reuse detection).
- [x] 🟡 **Dependências com vulnerabilidade alta** — `npm audit fix`/`--force` nos dois repos. Backend: `@fastify/swagger-ui` → 6.1.1, `vitest` → 4.1.10, `brace-expansion`/`fast-uri` corrigidos, 0 vulnerabilidades. Frontend: `nanoid`/`hono` corrigidos sem `--force`, 0 vulnerabilidades.
- [x] 🟡 **`/docs` (Swagger UI) exposto sem autenticação** — só registra quando `NODE_ENV !== 'production'` (`cygnus-api/src/infrastructure/http/build-app.ts`).
- [x] 🟡 **Nenhum header de segurança no Nginx que serve o app** — `nginx.conf` define `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` e `Content-Security-Policy` (com placeholder `<API_ORIGIN_PLACEHOLDER>` documentado para `connect-src`). HSTS deliberadamente **não** adicionado ainda — depende do bloqueador de HTTPS/TLS já aberto no `PRODUCTION_READINESS.md`.
- [x] 🟡 **Sem endpoint de exportação/portabilidade de dados (LGPD)** — `GET /users/me/export` implementado, retorna perfil + bebês + vacinas + consultas + marcos do usuário autenticado.
- [x] 🟡 **Nenhum audit log de acesso/alteração a dado de saúde infantil** — model `AuditLog` no Prisma (migration `20260811180501_add_audit_log`) + `AuditLogger` (fire-and-forget), chamado em apply/adhoc-create/delete de vacina, create/update de consulta, create/update/delete de marco.
- [x] 🟢 **CSRF sem token dedicado** — double-submit cookie: cookie `csrf_token` (não-HttpOnly) + header `X-CSRF-Token`, validado em `auth-guard.ts` para métodos que mutam estado; frontend lê o cookie e envia o header em `http-client.ts`.
- [x] 🟢 **`JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` só exigem `.min(1)`** — alterado para `.min(32)`; `.env`/`.env.test`/`.env.example`/`.env.test.example` atualizados com segredos de 32+ caracteres.

**Verificado e sem problema:** ownership checks (IDOR) consistentes em baby/appointment/milestone/vaccine; bcrypt custo 12; cookies HttpOnly+Secure(env)+SameSite=Strict corretos; sem `dangerouslySetInnerHTML`; sem segredos hardcoded versionados; sem analytics/tracking de terceiros plugado.

---

## ♿ Acessibilidade

- [x] 🔴 **Botões de ação só aparecem no hover — invisíveis para teclado e toque** — `MilestoneTimeline.tsx`/`FamilyStrip.tsx`: `opacity-0` trocado por `opacity-60` padrão + opacidade total em `hover`/`focus-visible`/`group-focus-within`, com pseudo-elemento de área de toque de 44px sem aumentar o ícone visível.
- [x] 🟡 **Formulário de aplicar vacina pode estourar a viewport sem scroll** — `max-h-[85vh] overflow-y-auto` adicionado ao `ApplyVaccineDialog.tsx`.
- [x] 🟡 **Alvos de toque abaixo de 44×44px em listas densas** — resolvido nos pontos reais identificados (botões de editar/toque em `MilestoneTimeline.tsx`/`FamilyStrip.tsx`) via área de toque expandida; variantes globais do `button.tsx` não foram alteradas para não quebrar layouts densos de desktop.
- [x] 🟡 **`aria-describedby` implementado de forma inconsistente** — corrigido em `VaccineApplicationDetailsFields.tsx` e `MilestoneCoreFields.tsx`, seguindo o padrão já usado em `BabyProfileFields.tsx`/`LoginForm.tsx`.
- [x] 🟡 **Animações não respeitam `prefers-reduced-motion`** — bloco `@media (prefers-reduced-motion: reduce)` adicionado em `src/index.css`.
- [x] 🟢 **Dark mode: tokens existem, zero forma de ativar** — implementado de verdade: `ThemeProvider` (persistência em `localStorage` + detecção de `prefers-color-scheme`), `ThemeToggle` no `AppShellLayout`/`AuthLayout`/`ProfileRoute`. Contraste dos tokens `.dark` conferido (≈5:1 primário, ≈14.6:1 texto — dentro de AA).
- [x] 🟢 **Borda de vacina `DELAYED` usa a cor de `PENDING`** — `VaccineCalendarList.tsx:103` corrigido para `border-rose-100`.
- [x] 🟢 **Diálogos sem proteção de altura consistente** — `max-h-[85vh] overflow-y-auto` padronizado em `RescheduleDialog.tsx`, `AppointmentDetailDialog.tsx`, `DeleteAccountDialog.tsx` (`AddAppointmentDialog.tsx` já tinha).

**Verificado e sem problema:** i18n com as mesmas 410 chaves nos 3 locales, sem faltas/sobras; nenhum `<table>` no código; status de vacina/marco sempre combina cor com ícone/texto; estados de erro distintos do skeleton nas 5 rotas principais.

**Precisa verificação manual (não testável só lendo código):** focus trap/retorno de foco em diálogos Radix; anúncio real de toasts via leitor de tela; quebra de layout em zoom 200%/fonte grande do SO.

---

## 🎨 Design

- [x] 🟡 Overflow do formulário de aplicar vacina — mesmo fix do item de acessibilidade acima.
- [x] 🟢 Padronização de `max-h`/`overflow-y-auto` em todos os `DialogContent` relevantes.

---

## 🧭 Usabilidade & Praticidade

- [x] 🟡 **Endpoint `/specialties` não existe no backend — feature morta em produção** — `GET /specialties` implementado (`cygnus-api/src/presentation/http/routes/specialty.routes.ts`), expõe `MEDICAL_SPECIALTIES` já existente no domínio. Contrato confirmado batendo com `medicalSpecialtyListSchema` do frontend.
- [x] 🟡 **Sem toast/confirmação visível nas ações centrais** — `sonner` adicionado em `RegisterVaccineDialog`, `ApplyVaccineDialog`, `AppointmentDetailDialog`, `RescheduleDialog`, `AddAppointmentDialog`, `AddMilestoneDialog`, `EditMilestoneDialog`, `AddBabyDialog`, `EditBabyDialog`.
- [x] 🟡 **Sem exclusão/correção de vacina aplicada por engano ou marco cadastrado errado** — `DELETE /babies/:babyId/milestones/:milestoneId` e `DELETE /babies/:babyId/vaccines/adhoc/:recordId` implementados no backend (escopo deliberadamente restrito a registros adhoc/campanha, não aos gerados pelo catálogo oficial), com UI de exclusão + confirmação (`AlertDialog`) no frontend.
- [x] 🟡 **Catálogo de vacinas cobre só 5 antígenos** — expandido para 29 entradas cobrindo o calendário PNI completo (nascimento → adolescência), com fonte citada no seed e comentários `REVIEW:` nos pontos de dosagem que merecem checagem pediátrica humana (Febre Amarela, HPV, Varicela/Tetra Viral).
- [ ] 🟡 **Sem modelo de guardião/compartilhamento entre responsáveis** — **fora de escopo desta rodada por decisão explícita** (feature nova: model de convite/household, migration, isolamento de acesso, UI de convite). Registrado aqui para priorização futura.
- [ ] 🟡 **Notificações são só in-app, sem push/e-mail/SMS** — **fora de escopo desta rodada por decisão explícita** (depende de decidir/integrar provedor externo — FCM, Resend, etc. — com credenciais). Registrado aqui para priorização futura.
- [x] 🟢 **Sem filtro por criança nas listas unificadas** — `BabyFilterChips` implementado e ligado a `VaccineCalendarList`, `AppointmentsList` e `MilestonesRoute` (estado local, sem store global).
- [x] 🟢 **Sem cadastro em lote de vacinas históricas** — `RegisterVaccineDialog` ganhou fluxo "adicionar outra?" após cada submissão, sem fechar o diálogo.
- [x] 🟢 **Sem indicador de "sem conexão"** — `useOnlineStatus` + `OfflineBanner` no `AppShellLayout`.

**Já rastreados em `PRODUCTION_READINESS.md` (não repetidos aqui em detalhe):** HTTPS/TLS + CORS de produção, política de privacidade/termos/consentimento, upload real de foto (hoje só URL), impressão/exportação da carteira de vacinação, PWA, busca/filtro/paginação nas listas, analytics de uso.

---

## Itens deixados de fora desta rodada (decisão explícita do usuário em 2026-08-11)

1. **Guardião/compartilhamento entre responsáveis** — exige model novo no Prisma (household/convite), migration, isolamento de acesso e UI de convite; é uma feature nova, não um bug fix.
2. **Notificação push/e-mail** — depende de escolher e integrar um provedor externo (FCM, Resend, SMTP, etc.) com credenciais.

## Verificação desta rodada

Todas as mudanças foram implementadas em dois repositórios (`cygnus` e `cygnus-api`) por agentes separados e depois verificadas de forma independente:
- Backend: `npm run build` (tsc) limpo, `npm test` → 214/214 passando, `npm audit --omit=dev` → 0 vulnerabilidades.
- Frontend: `npm run build` limpo, `npm test` → 68/68 passando, i18n com 410 chaves idênticas em `pt-BR.json`/`en.json`/`es.json`.
- Contratos de API conferidos manualmente: `/specialties`, `DELETE .../vaccines/adhoc/:recordId`, `DELETE .../milestones/:milestoneId`, e o esquema CSRF (cookie `csrf_token` + header `X-CSRF-Token`) batem entre os dois repositórios.

**Nada foi commitado** — todas as mudanças estão no working tree de `cygnus` e `cygnus-api` para revisão antes de commit/push.
