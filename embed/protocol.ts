/**
 * The message contract between a host page and an embedded Cygnus widget.
 *
 * Versioned from the first commit, on purpose. An embed is the one artifact whose consumers cannot
 * be redeployed: the `<script>` tag or `<iframe>` lives in someone else's HTML, and a host that
 * integrated version 1 keeps running version 1's expectations forever. Adding a field is safe;
 * changing the meaning of one is not, and needs a new PROTOCOL_VERSION with both handled for as
 * long as old hosts exist.
 *
 * Every message carries `source` so a host page listening on `window` can tell ours apart from the
 * other postMessage traffic on the page — analytics, chat widgets, framework devtools, all of which
 * broadcast to the same handler.
 */
export const EMBED_SOURCE = 'cygnus-embed' as const;
export const PROTOCOL_VERSION = 1 as const;

interface BaseMessage {
  source: typeof EMBED_SOURCE;
  version: typeof PROTOCOL_VERSION;
}

/** Sent once the widget has rendered and knows its size. A host may use it to reveal a placeholder. */
export interface ReadyMessage extends BaseMessage {
  type: 'ready';
  height: number;
}

/** Sent whenever the rendered height changes, so an iframe host can size the frame to its content. */
export interface ResizeMessage extends BaseMessage {
  type: 'resize';
  height: number;
}

/**
 * Sent when the visitor activates something that would navigate. The embed never navigates the host
 * itself: a widget that can move the page it sits in is a widget nobody will paste into their site.
 * The host decides what to do — open a tab, ignore it, or route internally.
 */
export interface NavigateMessage extends BaseMessage {
  type: 'navigate';
  url: string;
}

/** Sent when the schedule could not be loaded, so the host can react instead of showing a dead box. */
export interface ErrorMessage extends BaseMessage {
  type: 'error';
  reason: string;
}

export type EmbedMessage = ReadyMessage | ResizeMessage | NavigateMessage | ErrorMessage;

export function isEmbedMessage(data: unknown): data is EmbedMessage {
  if (typeof data !== 'object' || data === null) return false;
  const candidate = data as Partial<EmbedMessage>;
  return candidate.source === EMBED_SOURCE && candidate.version === PROTOCOL_VERSION;
}
