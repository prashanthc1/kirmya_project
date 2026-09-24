import { describe, it, expect, vi, afterEach } from 'vitest';
import { streamedContentSettled } from '../shared/streamedContent';

/*
 * The wait AuthProvider takes before applying the page-load session check: it
 * must hold while React still has a streamed boundary pending, and never hold
 * forever.
 */

function pendingBoundary(marker: '$?' | '$~') {
  const comment = document.createComment(marker);
  document.body.appendChild(comment);
  return comment;
}

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('streamedContentSettled', () => {
  it('resolves at once when nothing is streaming', async () => {
    document.body.appendChild(document.createComment('$'));
    let done = false;
    void streamedContentSettled().then(() => (done = true));
    await Promise.resolve();
    expect(done).toBe(true);
  });

  it.each(['$?', '$~'] as const)('waits while a boundary is marked %s, and resolves once it is revealed', async marker => {
    vi.useFakeTimers();
    const comment = pendingBoundary(marker);
    let done = false;
    void streamedContentSettled().then(() => (done = true));

    await vi.advanceTimersByTimeAsync(500);
    expect(done).toBe(false);

    comment.data = '$'; // what React's runtime does when it reveals the content
    await vi.advanceTimersByTimeAsync(50);
    expect(done).toBe(true);
  });

  it('never waits longer than its cap', async () => {
    vi.useFakeTimers();
    pendingBoundary('$?');
    let done = false;
    void streamedContentSettled(1000).then(() => (done = true));

    await vi.advanceTimersByTimeAsync(900);
    expect(done).toBe(false);
    await vi.advanceTimersByTimeAsync(200);
    expect(done).toBe(true);
  });
});
