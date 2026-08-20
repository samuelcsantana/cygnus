/**
 * The remote's stylesheet, as a string, kept apart from the component so the rules stay readable and
 * so a test can assert the prefix discipline without rendering anything.
 *
 * Every selector is class-based and `cygnus-mf-` prefixed. No element selectors, no `:root`, nothing
 * that reaches outside the component's own markup: this lands in a document whose CSS this project
 * has never seen, and the host is entitled to assume a widget cannot restyle its page.
 */
export const STYLE_ELEMENT_ID = 'cygnus-mf-vaccine-schedule-styles'

export const STYLES = `
.cygnus-mf-card {
  --cygnus-mf-accent: #186560;
  --cygnus-mf-surface: #ffffff;
  --cygnus-mf-border: #d9e2ec;
  --cygnus-mf-rule: #eef2f6;
  --cygnus-mf-text: #1f2933;
  --cygnus-mf-muted: #6b7280;
  box-sizing: border-box;
  border: 1px solid var(--cygnus-mf-border);
  border-radius: 12px;
  padding: 16px;
  background: var(--cygnus-mf-surface);
  color: var(--cygnus-mf-text);
  max-width: 420px;
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  line-height: 1.4;
}
.cygnus-mf-card *, .cygnus-mf-card *::before, .cygnus-mf-card *::after { box-sizing: border-box; }
.cygnus-mf-title { font-size: 15px; font-weight: 700; margin: 0 0 2px; color: var(--cygnus-mf-accent); }
.cygnus-mf-subtitle { font-size: 12px; color: var(--cygnus-mf-muted); margin: 0 0 12px; }
.cygnus-mf-list { list-style: none; margin: 0; padding: 0; }
.cygnus-mf-row {
  display: flex;
  gap: 10px;
  padding: 7px 0;
  border-top: 1px solid var(--cygnus-mf-rule);
}
.cygnus-mf-row:first-child { border-top: none; }
.cygnus-mf-age {
  flex: 0 0 74px;
  font-size: 11px;
  font-weight: 600;
  color: var(--cygnus-mf-accent);
  background: #e8f5f3;
  border-radius: 999px;
  padding: 2px 8px;
  height: fit-content;
  text-align: center;
}
.cygnus-mf-detail { min-width: 0; }
.cygnus-mf-name { font-size: 13px; font-weight: 600; margin: 0; color: var(--cygnus-mf-text); }
.cygnus-mf-name-button {
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  color: var(--cygnus-mf-text);
  background: none;
  border: 0;
  padding: 0;
  cursor: pointer;
  text-align: left;
}
.cygnus-mf-name-button:hover { color: var(--cygnus-mf-accent); text-decoration: underline; }
.cygnus-mf-dose { font-size: 11px; color: var(--cygnus-mf-muted); margin: 1px 0 0; }
.cygnus-mf-footer {
  margin: 12px 0 0;
  padding-top: 10px;
  border-top: 1px solid var(--cygnus-mf-rule);
  font-size: 11px;
}
.cygnus-mf-footer a { color: var(--cygnus-mf-accent); font-weight: 600; text-decoration: none; }
.cygnus-mf-footer a:hover { text-decoration: underline; }
.cygnus-mf-card :focus-visible { outline: 2px solid var(--cygnus-mf-accent); outline-offset: 2px; border-radius: 4px; }
.cygnus-mf-state { font-size: 12px; color: var(--cygnus-mf-muted); margin: 0; }
.cygnus-mf-error { color: #9b1c1c; }
.cygnus-mf-reason { font-size: 11px; color: var(--cygnus-mf-muted); margin: 4px 0 10px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
.cygnus-mf-retry {
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  color: var(--cygnus-mf-accent);
  background: none;
  border: 1px solid var(--cygnus-mf-accent);
  border-radius: 8px;
  padding: 5px 12px;
  cursor: pointer;
}
.cygnus-mf-retry:hover { background: #e8f5f3; }
@media (prefers-color-scheme: dark) {
  .cygnus-mf-card {
    --cygnus-mf-surface: #10201f;
    --cygnus-mf-border: #21403d;
    --cygnus-mf-rule: #1b3331;
    --cygnus-mf-text: #e6edf3;
  }
  .cygnus-mf-age { background: #16302e; }
  .cygnus-mf-retry:hover { background: #16302e; }
}
`
