/**
 * Waiting out React's streamed server rendering before a page-wide update.
 *
 * Pages here are server-rendered as a stream: the shell arrives first, with a
 * fallback in place of each Suspense boundary, and each boundary's content
 * follows later in the same response. React's inline runtime swaps that content
 * in - and in this React, not at once: it queues the reveal and batches it on
 * an animation frame or a timer of up to a few hundred milliseconds.
 *
 * Until a boundary has been revealed, React treats it as pending. If a context
 * provider above it changes value in that window, React cannot hydrate the
 * boundary first, so it throws the server HTML away and renders the boundary
 * again on the client - even for a transition. For a moment the page then holds
 * two copies of that content: the client's, and the server's hidden copy
 * waiting to be revealed. On /signin that is two sign-in forms.
 *
 * Nothing about this is specific to one page: every page streams under the
 * route-level loading boundary, and the session check on page load updates
 * the auth context above all of them.
 */

/** React marks a boundary whose content has not arrived, or not been revealed. */
const PENDING_BOUNDARY_MARKERS = new Set(['$?', '$~']);

function hasPendingBoundary(root: Node): boolean {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_COMMENT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (PENDING_BOUNDARY_MARKERS.has((node as Comment).data)) return true;
  }
  return false;
}

/**
 * Resolves once the document has finished streaming and React has revealed
 * every streamed boundary, or after maxWaitMs, whichever comes first.
 *
 * The markers are React's, not a public API. If a future React names them
 * differently this finds none and resolves at once - the behaviour from before
 * this existed - rather than holding anything up. The cap keeps a boundary that
 * never resolves from holding up the caller indefinitely.
 */
export function streamedContentSettled(maxWaitMs = 3000): Promise<void> {
  if (typeof document === 'undefined' || !document.body) return Promise.resolve();
  const settled = () => document.readyState !== 'loading' && !hasPendingBoundary(document.body);
  if (settled()) return Promise.resolve();

  return new Promise((resolve) => {
    const started = Date.now();
    // A timer rather than animation frames: frames do not run in a background
    // tab, and a tab opened in the background must still learn its session.
    const poll = () => {
      if (settled() || Date.now() - started >= maxWaitMs) resolve();
      else setTimeout(poll, 25);
    };
    setTimeout(poll, 25);
  });
}
