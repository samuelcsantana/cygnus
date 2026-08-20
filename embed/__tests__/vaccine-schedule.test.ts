import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { VaccineScheduleWidget, type ScheduleItem } from '../vaccine-schedule';
import { EMBED_SOURCE, PROTOCOL_VERSION, isEmbedMessage, type EmbedMessage } from '../protocol';

const SCHEDULE: ScheduleItem[] = [
  { id: '1', name: 'BCG', description: 'Tuberculose', recommendedAgeInMonths: 0, doseNumber: 1 },
  { id: '2', name: 'Hepatite B', description: 'Hepatite B', recommendedAgeInMonths: 0, doseNumber: 1 },
  { id: '3', name: 'Pentavalente', description: 'DTP + Hib + HepB', recommendedAgeInMonths: 2, doseNumber: 1 },
  { id: '4', name: 'Tríplice viral', description: 'Sarampo, caxumba, rubéola', recommendedAgeInMonths: 12, doseNumber: 1 },
];

/**
 * The shadow root is closed, so tests reach it the only way anything can: by capturing what
 * `attachShadow` returned. Deliberately not softened to `open` for testability — the isolation is
 * the feature under test, and a test that changes the thing it measures proves nothing.
 */
function mountWidget(options: { schedule?: ScheduleItem[]; fail?: boolean; limit?: number } = {}) {
  const host = document.createElement('div');
  document.body.appendChild(host);

  let captured: ShadowRoot | null = null;
  const original = host.attachShadow.bind(host);
  host.attachShadow = (init: ShadowRootInit) => {
    captured = original(init);
    return captured;
  };

  const messages: EmbedMessage[] = [];

  vi.stubGlobal(
    'fetch',
    vi.fn(async () =>
      options.fail
        ? { ok: false, status: 503, json: async () => ({}) }
        : { ok: true, status: 200, json: async () => ({ schedule: options.schedule ?? SCHEDULE }) },
    ),
  );

  const widget = new VaccineScheduleWidget(host, {
    apiOrigin: 'https://cygnus.samuelsantana.dev/api',
    limit: options.limit,
    emit: (message) => messages.push(message),
  });

  return { host, widget, messages, root: () => captured as ShadowRoot | null };
}

describe('VaccineScheduleWidget', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', class {
      observe() {}
      unobserve() {}
      disconnect() {}
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  it('renders the schedule inside a closed shadow root, invisible to the host page', async () => {
    const { host, widget, root } = mountWidget();
    await widget.render();

    expect(root()?.textContent).toContain('BCG');
    // The isolation claim, asserted rather than described: a host script holding the element still
    // cannot read what is inside it.
    expect(host.shadowRoot).toBeNull();
    expect(host.textContent).toBe('');
  });

  it('renders "Ao nascer" for month zero and pluralises the rest', async () => {
    const { widget, root } = mountWidget();
    await widget.render();

    const text = root()?.textContent ?? '';
    expect(text).toContain('Ao nascer');
    expect(text).toContain('2 meses');
    expect(text).toContain('1 ano');
  });

  it('honours the limit, because a sidebar is not the full PNI schedule', async () => {
    const { widget, root } = mountWidget({ limit: 2 });
    await widget.render();

    const items = root()?.querySelectorAll('li') ?? [];
    expect(items.length).toBe(2);
  });

  it('announces itself as ready with a height', async () => {
    const { widget, messages } = mountWidget();
    await widget.render();

    const ready = messages.find((message) => message.type === 'ready');
    expect(ready).toBeDefined();
    expect(ready).toMatchObject({ source: EMBED_SOURCE, version: PROTOCOL_VERSION });
  });

  it('emits navigate instead of moving the host page', async () => {
    const { widget, messages, root } = mountWidget();
    await widget.render();

    const link = root()?.querySelector<HTMLAnchorElement>('[data-navigate]');
    expect(link).toBeTruthy();

    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    link?.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(messages.some((message) => message.type === 'navigate')).toBe(true);
  });

  it('never sends credentials, so a wildcard-CORS endpoint can never be called as the visitor', async () => {
    const { widget } = mountWidget();
    await widget.render();

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/public/vaccine-schedule'), { credentials: 'omit' });
  });

  it('reports failure to the host instead of leaving a dead box', async () => {
    const { widget, messages, root } = mountWidget({ fail: true });
    await widget.render();

    expect(root()?.textContent).toContain('Não foi possível carregar');
    expect(messages.some((message) => message.type === 'error')).toBe(true);
  });
});

describe('isEmbedMessage', () => {
  it('accepts our own messages', () => {
    expect(isEmbedMessage({ source: EMBED_SOURCE, version: PROTOCOL_VERSION, type: 'ready', height: 10 })).toBe(true);
  });

  it('rejects the other postMessage traffic a host page receives', () => {
    expect(isEmbedMessage({ source: 'react-devtools-bridge' })).toBe(false);
    expect(isEmbedMessage({ source: EMBED_SOURCE, version: 99 })).toBe(false);
    expect(isEmbedMessage(null)).toBe(false);
    expect(isEmbedMessage('cygnus-embed')).toBe(false);
  });
});
