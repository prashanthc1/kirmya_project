import { api } from './api';

/**
 * Tell the server which workspace this account chose to enter.
 *
 * Best-effort, deliberately. The switcher's job is to navigate, and the
 * navigation has already happened by the time this resolves — the link is a
 * real link, not a handler that waits on a request. If this fails the account
 * still arrives exactly where it clicked; the only consequence is that the next
 * sign-in lands on the feed, which is where it landed before any of this
 * existed. Blocking a workspace change on a preference write, or surfacing an
 * error for one, would make a convenience look like a failure.
 *
 * The server refuses a key the account's own workspace list does not contain.
 * That refusal is not reported here for the same reason: it protects nothing —
 * a stored key grants no access — and there is nothing the person clicking
 * could do about it.
 */
export async function rememberWorkspace(key: string): Promise<void> {
  try {
    await api.put('/workspace/preference', { key });
  } catch {
    // Intentionally swallowed. See above.
  }
}
