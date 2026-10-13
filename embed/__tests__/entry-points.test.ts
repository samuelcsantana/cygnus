import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ScheduleItem } from '../../src/shared/public-schedule';
import { EMBED_SOURCE, PROTOCOL_VERSION, type EmbedMessage } from '../protocol';

const SCHEDULE: ScheduleItem[] = [
  { id: '1', name: 'BCG', description: 'Tuberculose', recommendedAgeInMonths: 0, doseNumber: 1 },
  { id: '2', name: 'Hepatite B', description: 'Hepatite B', recommendedAgeInMonths: 0, doseNumber: 1 },
];

/**
 * The two published entry points, loaded the way a host page loads them. The widget class has its
 * own tests; these pin what only the entries do - read their options from the host's markup or the
 * frame's URL, mount exactly once, and hand the protocol messages to the host by the transport each
 * variant uses. A host cannot be redeployed to follow a change here, so the contract is the test.
 */
function stubSchedule() {
  const fetch = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ schedule: SCHEDULE }) }));
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

afterEach(() => {
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
  vi.resetModules();
  window.history.replaceState(null, '', '/');
});

describe('embed.js, the script-tag variant', () => {
  const tag = (attributes: string) =>
    `<div id="vacinas"></div><script src="https://cygnus.samuelsantana.dev/embed/embed.js" data-target="#vacinas" ${attributes}></script>`;

  it('mounts one widget into the element its own script tag names, with the options the tag carries', async () => {
    const fetch = stubSchedule();
    document.body.innerHTML = tag('data-limit="2" data-theme="dark" data-api-origin="https://example.test/api"');

    await import('../embed');

    const element = document.querySelector('#vacinas cygnus-vaccine-schedule');
    expect(element?.getAttribute('limit')).toBe('2');
    expect(element?.getAttribute('theme')).toBe('dark');
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledWith('https://example.test/api/public/vaccine-schedule', expect.anything()));
  });

  it('mounts nothing more when the same script runs a second time', async () => {
    stubSchedule();
    document.body.innerHTML = tag('');

    await import('../embed');
    vi.resetModules();
    await import('../embed');

    expect(document.querySelectorAll('cygnus-vaccine-schedule')).toHaveLength(1);
  });

  // A script in <head> without `defer` runs before the target exists.
  it('waits for the document when it runs before the target is parsed', async () => {
    stubSchedule();
    document.body.innerHTML = tag('');
    Object.defineProperty(document, 'readyState', { configurable: true, get: () => 'loading' });

    try {
      await import('../embed');
      expect(document.querySelector('cygnus-vaccine-schedule')).toBeNull();

      document.dispatchEvent(new Event('DOMContentLoaded'));
      expect(document.querySelector('#vacinas cygnus-vaccine-schedule')).not.toBeNull();
    } finally {
      delete (document as { readyState?: unknown }).readyState;
    }
  });

  it('turns protocol messages into bubbling DOM events, the idiom a host page already listens to', async () => {
    stubSchedule();
    await import('../embed');
    const received: EmbedMessage[] = [];
    document.addEventListener('cygnus:ready', (event) => received.push((event as CustomEvent<EmbedMessage>).detail));

    document.body.innerHTML = '<section><cygnus-vaccine-schedule limit="1"></cygnus-vaccine-schedule></section>';

    await vi.waitFor(() => expect(received).toHaveLength(1));
    expect(received[0]).toMatchObject({ source: EMBED_SOURCE, version: PROTOCOL_VERSION, type: 'ready' });
  });
});

describe('iframe.html, the isolated variant', () => {
  it('renders into #root with the options in its URL and reports to the parent window', async () => {
    const fetch = stubSchedule();
    window.history.replaceState(null, '', '/embed/iframe.html?limit=1&theme=light&apiOrigin=https%3A%2F%2Fexample.test%2Fapi');
    document.body.innerHTML = '<div id="root"></div>';
    const received: EmbedMessage[] = [];
    const listener = (event: MessageEvent) => received.push(event.data as EmbedMessage);
    window.addEventListener('message', listener);

    try {
      await import('../iframe');

      expect(document.getElementById('root')?.getAttribute('theme')).toBe('light');
      expect(fetch).toHaveBeenCalledWith('https://example.test/api/public/vaccine-schedule', expect.anything());
      await vi.waitFor(() => expect(received).toContainEqual(expect.objectContaining({ source: EMBED_SOURCE, type: 'ready' })));
    } finally {
      window.removeEventListener('message', listener);
    }
  });
});
