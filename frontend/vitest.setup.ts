import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import axios from 'axios';

afterEach(() => {
  cleanup();
});

// jsdom implements neither of these, and MUI's responsive components and
// scroll-into-view calls both reach for them.
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

if (!window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

Element.prototype.scrollIntoView = vi.fn();

// The component and API-client tests are hermetic: every service in the app
// falls back to a documented fixture when its request fails, and the suite
// asserts against those fixtures. Left unstubbed, the tests reach
// http://localhost:8080 for real, so the same test passes with the backend
// stopped and fails with it running — an empty local database answers 200 with
// zeroed counters instead of failing into the fallback. Refusing every request
// here pins the behaviour the assertions were written against.
const networkDisabled = () =>
  Promise.reject(new Error('Network access is disabled in unit tests'));

vi.stubGlobal('fetch', vi.fn(networkDisabled));
axios.defaults.adapter = networkDisabled;
