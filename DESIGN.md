# Design Tokens — Meu Neném

Source of truth: `samuelcsantana/BabyCareAppDesign` (private GitHub repo, a
Figma Make export — `src/App.tsx`). Cloned locally for reference at
`D:\github\BabyCareAppDesign` during the redesign. Supersedes the original
Figma file + the `#0f5653` teal documented previously in `AGENTS.md` Section
0; the Figma file is still the reference for any screen this repo's
`App.tsx` doesn't cover.

All values below are already wired into `src/index.css`'s `@theme` block —
this file exists so future screens can be built by copying class names
directly instead of re-deriving hex values from the reference by eye (see
`AGENTS.md` Section 0's note on why that went wrong the first time).

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
| `ink-faint` | `#5F6E81` | Tertiary/placeholder text (**not** the reference's `#9AA5B4` — see below) |

### Contrast deviations from the reference

Four tokens deliberately do not match the reference. Each was measured below a
WCAG threshold and each is commented at its point of definition in
`src/index.css`. The Storybook accessibility suite (axe on every story, both
themes, no standing exceptions) is what found three of them and is what keeps
all four from regressing.

| Token | Reference | Shipped | Measured problem |
|---|---|---|---|
| `--primary` | `#2A9D8F` teal-500 | `#186560` teal-700 | ~3.3:1 both as fill and as text |
| `--color-ink-faint` | `#9AA5B4` | `#5F6E81` | 2.49:1 on white, used as 10–12px copy in 25 places |
| `--destructive` | `oklch(0.577 0.245 27.325)` | `oklch(0.529 …)` | 3.98:1 as text on its own 10% tint |
| `--muted-foreground` | `oklch(0.556 0 0)` | `oklch(0.532 0 0)` | 4.34:1 on `--muted` |

Darkening `ink-faint` compresses the bottom of the ink scale: `ink-muted` and
`ink-faint` now read closer together than the reference intended. Accepted
deliberately — the alternative is a tertiary text level that cannot be read.

### Dark mode

`surface` and the three `ink` steps are fixed hex values, so they do not invert
on their own; `.dark` in `src/index.css` redefines all four. Ratios are measured
against `--card` (the darkest surface they are painted on): `ink` 16.4:1,
`ink-muted` 8.6:1, `ink-faint` 5.9:1.

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
- **Vaccine registration wizard**: built as `RegisterVaccineDialog`,
  backed by the `cygnus-api` adhoc endpoints
  (`GET`/`POST /babies/{id}/vaccines/adhoc`) and by
  `PATCH /babies/{id}/vaccines/{id}/apply` now also accepting
  batch/location/professional/photo for known-catalog vaccines.
- **Dark mode**: the reference has none; the app's existing dark tokens are
  untouched.
