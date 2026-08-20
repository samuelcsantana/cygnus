import { APP_ORIGIN, fetchPublicSchedule, formatAge, type ScheduleItem } from '../src/shared/public-schedule';

import { EMBED_SOURCE, PROTOCOL_VERSION, type EmbedMessage } from './protocol';

export interface WidgetOptions {
  /** Origin serving the Cygnus API. Overridable so the same bundle works in dev and on a preview. */
  apiOrigin: string;
  /** Cap on how many rows to render. The full PNI schedule is long; a sidebar widget is not. */
  limit?: number;
  /** Called for every outbound message, so the two variants can differ in transport only. */
  emit: (message: EmbedMessage) => void;
}

/**
 * Styles live in a template string rather than a stylesheet because the whole point is that they
 * never leave the shadow root. There is no build step that could accidentally extract them into a
 * global CSS file the host also loads, and no class name that could collide with the host's.
 */
const STYLES = `
  :host {
    all: initial;
    display: block;
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    color: #1f2933;
    line-height: 1.4;
  }
  * { box-sizing: border-box; }
  .card {
    border: 1px solid #d9e2ec;
    border-radius: 12px;
    padding: 16px;
    background: #ffffff;
    max-width: 420px;
  }
  .title { font-size: 15px; font-weight: 700; margin: 0 0 2px; color: #186560; }
  .subtitle { font-size: 12px; color: #6b7280; margin: 0 0 12px; }
  ul { list-style: none; margin: 0; padding: 0; }
  li { display: flex; gap: 10px; padding: 7px 0; border-top: 1px solid #eef2f6; }
  li:first-child { border-top: none; }
  .age {
    flex: 0 0 74px;
    font-size: 11px;
    font-weight: 600;
    color: #186560;
    background: #e8f5f3;
    border-radius: 999px;
    padding: 2px 8px;
    height: fit-content;
    text-align: center;
  }
  .name { font-size: 13px; font-weight: 600; margin: 0; }
  .dose { font-size: 11px; color: #6b7280; margin: 1px 0 0; }
  .footer { margin-top: 12px; padding-top: 10px; border-top: 1px solid #eef2f6; font-size: 11px; }
  a { color: #186560; font-weight: 600; text-decoration: none; }
  a:hover { text-decoration: underline; }
  a:focus-visible { outline: 2px solid #186560; outline-offset: 2px; border-radius: 4px; }
  .state { font-size: 12px; color: #6b7280; margin: 0; }
  .error { color: #9b1c1c; }
  @media (prefers-color-scheme: dark) {
    .card { background: #10201f; border-color: #21403d; }
    :host { color: #e6edf3; }
    .name { color: #e6edf3; }
    li { border-color: #1b3331; }
    .footer { border-color: #1b3331; }
  }
`;

/**
 * Renders the public PNI schedule into a shadow root.
 *
 * Shared by both distribution variants — script tag and iframe — so the two can never drift in what
 * they show. What differs is only how `emit` gets a message to the host.
 */
export class VaccineScheduleWidget {
  private readonly root: ShadowRoot;
  private readonly options: WidgetOptions;
  private lastHeight = 0;
  private observer: ResizeObserver | null = null;

  constructor(host: HTMLElement, options: WidgetOptions) {
    this.options = options;
    // `closed` is deliberate: the host page cannot reach into this tree, which means it cannot
    // restyle it into something misleading, and equally cannot break it by accident.
    //
    // No `host.shadowRoot ??` guard, because closed mode makes that property permanently null —
    // it would read like reuse protection while never once being true. Constructing twice against
    // the same host throws, and the callers guard against that themselves.
    this.root = host.attachShadow({ mode: 'closed' });
  }

  async render(): Promise<void> {
    this.paint(`<p class="state">Carregando o calendário vacinal…</p>`);

    try {
      const schedule = await fetchPublicSchedule(this.options.apiOrigin);
      this.paintSchedule(schedule);
      this.emitSize('ready');
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'unknown';
      this.paint(`<p class="state error">Não foi possível carregar o calendário vacinal.</p>`);
      this.options.emit({ source: EMBED_SOURCE, version: PROTOCOL_VERSION, type: 'error', reason });
      this.emitSize('ready');
    }
  }

  private paintSchedule(schedule: ScheduleItem[]): void {
    const limit = this.options.limit ?? 8;
    const items = schedule.slice(0, limit);

    const rows = items
      .map(
        (item) => `
        <li>
          <span class="age">${escapeHtml(formatAge(item.recommendedAgeInMonths))}</span>
          <div>
            <p class="name">${escapeHtml(item.name)}</p>
            <p class="dose">${item.doseNumber}ª dose</p>
          </div>
        </li>`,
      )
      .join('');

    this.paint(`
      <div class="card">
        <p class="title">Calendário vacinal</p>
        <p class="subtitle">Programa Nacional de Imunizações — primeiras ${items.length} doses</p>
        <ul>${rows}</ul>
        <p class="footer"><a href="${APP_ORIGIN}" data-navigate>Acompanhar as vacinas do seu bebê →</a></p>
      </div>
    `);

    const link = this.root.querySelector('[data-navigate]');
    link?.addEventListener('click', (event) => {
      // The host owns navigation. See NavigateMessage in protocol.ts for why the embed never
      // navigates the page it is embedded in.
      event.preventDefault();
      this.options.emit({
        source: EMBED_SOURCE,
        version: PROTOCOL_VERSION,
        type: 'navigate',
        url: APP_ORIGIN,
      });
    });

    this.watchSize();
  }

  private paint(html: string): void {
    this.root.innerHTML = `<style>${STYLES}</style>${html}`;
  }

  private watchSize(): void {
    if (this.observer || typeof ResizeObserver === 'undefined') return;

    const card = this.root.querySelector('.card');
    if (!card) return;

    this.observer = new ResizeObserver(() => this.emitSize('resize'));
    this.observer.observe(card);
  }

  private emitSize(type: 'ready' | 'resize'): void {
    const card = this.root.querySelector('.card');
    const height = Math.ceil(card?.getBoundingClientRect().height ?? 0);

    // Sub-pixel churn would otherwise produce a message per frame while a host animates.
    if (type === 'resize' && Math.abs(height - this.lastHeight) < 2) return;

    this.lastHeight = height;
    this.options.emit({ source: EMBED_SOURCE, version: PROTOCOL_VERSION, type, height });
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
