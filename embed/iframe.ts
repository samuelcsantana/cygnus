import { VaccineScheduleWidget } from './vaccine-schedule';
import type { EmbedMessage } from './protocol';

/**
 * Iframe variant: the same widget, rendered in a document served from the Cygnus origin.
 *
 * An iframe cannot size itself to its content — the host sets the height, and the host cannot see
 * inside a cross-origin frame to measure it. postMessage is how the frame reports what layout would
 * have told the host for free in the script-tag variant. That is the real cost of isolation here,
 * and it is why the `resize` message exists at all.
 */
const params = new URLSearchParams(window.location.search);
const apiOrigin = params.get('apiOrigin') ?? '/api';
const limit = Number.parseInt(params.get('limit') ?? '', 10);

const mount = document.getElementById('root');

if (mount) {
  const widget = new VaccineScheduleWidget(mount, {
    apiOrigin,
    limit: Number.isNaN(limit) ? undefined : limit,
    // '*' as the target origin is correct here and deliberate: this widget is meant to be embedded
    // by sites this project does not know about, so there is no allowlist to check against. It is
    // safe because every message is public, non-personal data — the height of a box and a link that
    // is already printed in the markup. Nothing sensitive is ever posted, so nothing leaks to a
    // host we did not anticipate. If a message ever carries user data, this must become an
    // explicit allowlist on the same commit.
    emit: (message: EmbedMessage) => window.parent.postMessage(message, '*'),
  });

  void widget.render();
}
