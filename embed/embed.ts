import { VaccineScheduleWidget } from './vaccine-schedule';
import type { EmbedMessage } from './protocol';

const ELEMENT_NAME = 'cygnus-vaccine-schedule';
const DEFAULT_API_ORIGIN = 'https://cygnus.samuelsantana.dev/api';

/**
 * Script-tag variant: a custom element rendered directly into the host's DOM.
 *
 * Trade-off against the iframe variant, stated once here and in the README:
 *
 * - **This one integrates.** It inherits the host's layout, reflows with it, and costs one small
 *   request. What it cannot do is isolate JavaScript — it runs on the host's origin, with access to
 *   the host's DOM, and asks the host to trust this code.
 * - **The iframe isolates.** Separate origin, separate JS context, nothing shared. It pays for that
 *   with a second document and needing postMessage to do what layout would otherwise do for free.
 *
 * Style isolation is identical in both, because both render into a shadow root. The choice is only
 * about script isolation and trust.
 */
class CygnusVaccineScheduleElement extends HTMLElement {
  private widget: VaccineScheduleWidget | null = null;

  connectedCallback(): void {
    if (this.widget) return;

    const apiOrigin = this.getAttribute('api-origin') ?? DEFAULT_API_ORIGIN;
    const limitAttribute = Number.parseInt(this.getAttribute('limit') ?? '', 10);

    this.widget = new VaccineScheduleWidget(this, {
      apiOrigin,
      limit: Number.isNaN(limitAttribute) ? undefined : limitAttribute,
      // In-DOM there is no frame boundary to cross, so messages surface as DOM events — the idiom a
      // host page already has handlers for. Same contract, same version, different transport.
      emit: (message: EmbedMessage) => {
        this.dispatchEvent(new CustomEvent(`cygnus:${message.type}`, { detail: message, bubbles: true, composed: true }));
      },
    });

    void this.widget.render();
  }
}

if (!customElements.get(ELEMENT_NAME)) {
  customElements.define(ELEMENT_NAME, CygnusVaccineScheduleElement);
}

/**
 * Convenience mount for hosts that would rather drop in one script tag than write markup:
 *
 *   <script src="https://cygnus.samuelsantana.dev/embed/embed.js" data-target="#vacinas" defer></script>
 *
 * `document.currentScript` is null in a module or when the script is executed asynchronously, so the
 * lookup falls back to finding our own tag by src.
 */
function autoMount(): void {
  const script =
    (document.currentScript as HTMLScriptElement | null) ??
    document.querySelector<HTMLScriptElement>('script[src*="embed.js"][data-target]');

  const selector = script?.dataset.target;
  if (!selector) return;

  const container = document.querySelector(selector);
  if (!container || container.querySelector(ELEMENT_NAME)) return;

  const element = document.createElement(ELEMENT_NAME);
  if (script?.dataset.apiOrigin) element.setAttribute('api-origin', script.dataset.apiOrigin);
  if (script?.dataset.limit) element.setAttribute('limit', script.dataset.limit);

  container.appendChild(element);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoMount, { once: true });
} else {
  autoMount();
}
