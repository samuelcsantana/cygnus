/**
 * The ambient backdrop behind the auth card.
 *
 * The motif is a growth curve with milestones marked along it — the one image
 * that is unmistakably about tracking a child over time, which is what this app
 * does. It is drawn rather than decorated with icons: a scatter of syringes and
 * rattles would read as a sticker sheet, while a rising line reads as the
 * subject without ever competing with the form.
 *
 * Every layer is decorative and inert: `aria-hidden`, no pointer events, no
 * text. The colours are token colours at low alpha over --color-surface, never
 * fixed light hex values, so the whole thing inverts with the theme instead of
 * needing a dark-mode twin.
 *
 * The central band is masked out of every patterned layer. Below `sm` there is
 * no card — the form sits straight on this — and anything drawn behind a label
 * costs legibility that axe cannot even measure, because it scans the nearest
 * opaque ancestor and never sees a sibling SVG.
 */
export function AuthBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Wash. Mint in the top-left and peach in the bottom-right are sampled
          from the design reference (#c8f0df / #fee8d4); the violet is the
          milestones accent, and it keeps the middle of a wide viewport from
          going flat grey between the two corners. Smaller and weaker below
          `sm`, where a 34rem orb would cover a whole phone screen. */}
      <div className="absolute -top-40 -left-32 h-[22rem] w-[22rem] rounded-full bg-emerald-200/40 blur-3xl sm:-top-48 sm:-left-40 sm:h-[34rem] sm:w-[34rem] sm:bg-emerald-200/55 dark:bg-emerald-700/15" />
      <div className="absolute -right-40 -bottom-44 h-[24rem] w-[24rem] rounded-full bg-amber-100/40 blur-3xl sm:-right-48 sm:-bottom-56 sm:h-[36rem] sm:w-[36rem] sm:bg-amber-100/60 dark:bg-amber-500/8" />
      <div className="absolute top-1/3 left-1/2 hidden h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-violet-50/60 blur-3xl sm:block dark:bg-violet-500/8" />

      {/* Growth curve. `slice` keeps the strokes round at any aspect ratio —
          stretching the viewBox to fit would flatten them into ellipses. */}
      {/* Hidden below `sm`, and that is the whole reason the drawing can be as
          present as it is. From `sm` up the card is opaque and simply covers
          the middle of it, so nothing is ever read through the curve — the
          mask below only softens the approach to the card's edge. On a phone
          there is no card, and `slice` crops a 1440-wide composition down to
          its centre strip, which is exactly the part the form sits on. The
          wash carries the theme there instead.

          The two themes also need different amounts of it: emerald-600 over a
          near-white page is much weaker than emerald-400 over near-black. */}
      <svg
        className="absolute inset-0 hidden h-full w-full text-emerald-600 opacity-90 [mask-image:radial-gradient(ellipse_at_center,transparent_16%,black_52%)] sm:block dark:text-emerald-400 dark:opacity-55"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <defs>
          {/* currentColor rather than a var() in stop-color: presentation
              attributes have never resolved custom properties reliably across
              browsers, while currentColor always has — and it lets the one
              `text-emerald-*` class above retheme the whole drawing. */}
          <linearGradient id="auth-backdrop-curve" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="currentColor" stopOpacity="0.25" />
            <stop offset="0.5" stopColor="currentColor" stopOpacity="0.95" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0.5" />
          </linearGradient>
        </defs>

        <g stroke="url(#auth-backdrop-curve)" strokeLinecap="round">
          <path
            d="M -60 706 C 210 692 372 612 556 560 C 762 502 942 466 1122 378 C 1284 299 1382 250 1500 206"
            strokeWidth="2"
          />
          <path
            d="M -60 812 C 250 800 414 738 618 694 C 838 646 1020 606 1198 528 C 1330 470 1420 430 1500 396"
            strokeWidth="1.2"
            opacity="0.6"
          />
          <path
            d="M -60 530 C 232 508 396 428 596 386 C 800 343 980 302 1160 222"
            strokeWidth="1"
            opacity="0.38"
          />
        </g>

        {/* Milestones on the curve: a filled point inside a wide, faint ring,
            the same shape the app draws for a logged milestone. */}
        <g fill="currentColor" stroke="currentColor">
          {[
            // Placed to land in the strips the card leaves free: which of
            // them is visible changes with the viewport, and any that falls
            // behind the card simply does not render.
            { x: 210, y: 692 },
            { x: 556, y: 560 },
            { x: 1122, y: 378 },
            { x: 1300, y: 287 },
          ].map((point) => (
            <g key={`${point.x}-${point.y}`}>
              <circle cx={point.x} cy={point.y} r="4" fillOpacity="0.55" stroke="none" />
              <circle cx={point.x} cy={point.y} r="12" fill="none" strokeOpacity="0.28" strokeWidth="1.25" />
            </g>
          ))}
        </g>

        {/* Four-point sparkles — the milestones icon, reduced to its silhouette
            and scattered where the card never reaches. */}
        <g fill="currentColor" fillOpacity="0.3">
          {[
            { x: 1268, y: 132, s: 1.5 },
            { x: 1348, y: 236, s: 0.9 },
            { x: 148, y: 214, s: 1.2 },
            { x: 262, y: 116, s: 0.8 },
            { x: 1180, y: 748, s: 1.1 },
            { x: 96, y: 640, s: 0.85 },
          ].map((sparkle) => (
            <path
              key={`${sparkle.x}-${sparkle.y}`}
              transform={`translate(${sparkle.x} ${sparkle.y}) scale(${sparkle.s})`}
              d="M 0 -9 C 1.2 -2.6 2.6 -1.2 9 0 C 2.6 1.2 1.2 2.6 0 9 C -1.2 2.6 -2.6 1.2 -9 0 C -2.6 -1.2 -1.2 -2.6 0 -9 Z"
            />
          ))}
        </g>
      </svg>

      {/* The reference's faint diagonal streaking, kept as paper texture under
          everything else. Painted with --color-ink so it inverts with the theme. */}
      <div className="absolute inset-0 opacity-[0.025] [background-image:repeating-linear-gradient(115deg,var(--color-ink)_0px,var(--color-ink)_1px,transparent_1px,transparent_9px)] [mask-image:radial-gradient(ellipse_at_center,transparent_35%,black)]" />
    </div>
  )
}
