// Patch read-only window.fetch/globalThis.fetch on sandboxed iframe environments (such as preview context)
// to prevent "TypeError: Cannot set property fetch of #<Window> which has only a getter" when web3 libraries run.
if (typeof window !== 'undefined') {
  try {
    const originalFetch = window.fetch;
    const boundFetch = originalFetch ? originalFetch.bind(window) : undefined;
    let customFetch = boundFetch;

    const patchObject = (obj: any) => {
      if (!obj) return;
      try {
        const desc = Object.getOwnPropertyDescriptor(obj, 'fetch');
        if (desc && !desc.configurable) {
          return;
        }
        Object.defineProperty(obj, 'fetch', {
          get() { return customFetch; },
          set(val) { customFetch = val; },
          configurable: true,
          enumerable: false
        });
      } catch (e) {
        // Ignore
      }
    };

    patchObject(window);
    if (typeof globalThis !== 'undefined') patchObject(globalThis);
    if (typeof self !== 'undefined') patchObject(self);
  } catch (err) {
    console.warn("Fetch main entry patch failed:", err);
  }
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
