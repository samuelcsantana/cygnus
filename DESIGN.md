# Design Tokens — Meu Neném

Source of truth: `samuelcsantana/BabyCareAppDesign` (private GitHub repo, a
Figma Make export — `src/App.tsx`). Cloned locally for reference at
`D:\github\BabyCareAppDesign` during the redesign. Supersedes the original
Figma file + the `#0f5653` teal documented previously in `CLAUDE.md` Section
0; the Figma file is still the reference for any screen this repo's
`App.tsx` doesn't cover.

All values below are already wired into `src/index.css`'s `@theme` block —
this file exists so future screens can be built by copying class names
directly instead of re-deriving hex values from the reference by eye (see
`CLAUDE.md` Section 0's note on why that went wrong the first time).

## Color

| Token | Hex | Usage |
|---|---|---|
| `teal-50` | `#E8F5F3` | Light backgrounds, active nav state |
| `teal-100` | `#C7E9E4` | Borders on teal surfaces |
| `teal-200` | `#8ED3CA` | Dashed borders (e.g. "add child") |
| `teal-400` | `#43BAB0` | Gradient endpoints |
| `teal-500` | `#2A9D8F` | **Primary brand color** (`--primary`, `--ring`, `--sidebar-primary`) |
| `teal-600` | `#21837A` | Hover states, gradient mid-stop |
| `teal-700` | `#186560` | Gradient dark stop (auth left panel) |
| `amber-50` | `#FEF3E8` | Light backgrounds (milestones/social accents) |
| `amber-100` | `#FDDDB8` | Borders on amber surfaces |
| `amber-400` | `#F4A261` | Decorative accents |
| `amber-500` | `#E8853A` | Decorative accents |
| `rose-50` | `#FEF0F1` | Light backgrounds (delayed/alert states) |
| `rose-400` | `#E8727A` | Decorative accents |
| `rose-500` | `#D95560` | Decorative accents |
| `violet-50` | `#F0EEFF` | Light backgrounds (appointments accent) |
| `violet-400` | `#8B80F9` | Decorative accents |
| `violet-500` | `#6C63FF` | Decorative accents |
| `surface` | `#F6F7F4` | App shell page background |
| `ink` | `#1A2332` | Primary text |
| `ink-muted` | `#5A6478` | Secondary text |
| `ink-faint` | `#9AA5B4` | Tertiary/placeholder text |

Darker text-safe shades (`teal-800`+ excepted — see below; `amber-600/700`,
`rose-600/700`, `violet-600/700`, etc.) are **not** overridden — they
resolve to Tailwind's stock palette. The reference's own light-mode-only
mockup uses shades like `amber-400`/`amber-500` as text color on light
backgrounds, which fails WCAG AA contrast (this exact class of bug was
already found and fixed once in this codebase — see
`PRODUCTION_READINESS.md`). Stock Tailwind's 600/700 shades are dark enough
to stay accessible; only the light/decorative shades are pinned to the
reference's exact hex.

### Per-feature/status color map

Not a single global palette — the reference deliberately colors each
concept differently. This is the actual mapping (see the redesign's
"Color remapping table" for the before/after diff against the previous
ad hoc Tailwind usage):

| Concept | Color |
|---|---|
| Vaccine `APPLIED` / Appointment `COMPLETED` ("done") | teal |
| Vaccine `PENDING` | amber |
| Vaccine `DELAYED` | rose |
| Appointment `SCHEDULED` | violet |
| Appointment `CANCELLED` | neutral slate (not modeled in the reference) |
| Milestone `MOTOR` | teal |
| Milestone `LANGUAGE` | violet |
| Milestone `SOCIAL` | amber |
| Milestone `COGNITIVE` | rose |
| Milestone `OTHER` | neutral slate (not modeled in the reference) |
| Notification `VACCINE_DELAYED` | rose |
| Notification `APPOINTMENT_UPCOMING` | violet |

## Typography

- **Display/headings** (`font-display`, aliased to `--font-heading`):
  Nunito Variable, weights 700–900. Loaded via `@fontsource-variable/nunito`
  (same self-hosting convention as the existing Inter, not the reference's
  Google Fonts CDN import).
- **Body** (`font-sans`): Inter Variable — unchanged from before.

## Radius

Unchanged — `--radius: 0.625rem` and its derived `sm`/`md`/`lg`/`xl`/`2xl`/
`3xl`/`4xl` scale already produce values close enough to the reference's
literal `18px`/`24px`/`28px` card/modal radii (`--radius-2xl` = 18px
exactly) that a new base wasn't needed.

## Deliberately not adopted from the reference

- **Branding**: kept "Meu Neném" (name, heart logo mark) — the reference
  calls the app "Crescer" with a 🌱 mark, but that's a placeholder from the
  Figma Make prototype, not a product rename.
- **Vaccine registration wizard**: the reference's multi-step "type of
  vaccine" picker (calendário/campanha/outra) plus batch/clinic/
  professional/photo/reminder fields aren't backed by any `cygnus-api`
  endpoint — `PATCH /babies/{id}/vaccines/{id}/apply` only accepts
  `applicationDate` + `notes` for a known vaccine. Not built; a candidate
  future backend request, same as `DELETE /babies/{id}` was before it
  shipped.
- **Dark mode**: the reference has none; the app's existing dark tokens are
  untouched.
